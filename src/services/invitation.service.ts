import { supabase, getSupabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

export interface InvitationToken {
  id: string;
  token: string;
  teacher_id: string;
  parent_id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherInvitationData {
  teacher_id: string;
  parent_id: string;
  teacher_email: string;
  teacher_name: string;
  parent_name: string;
}

export class InvitationService {
  // Token expiration: 7 days
  private static readonly TOKEN_EXPIRATION_DAYS = 7;

  /**
   * Generate a cryptographically secure invitation token
   */
  static generateSecureToken(): string {
    // Generate 32 random bytes and convert to base64url
    const buffer = crypto.randomBytes(32);
    return buffer
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Create an invitation token for a teacher
   */
  static async createInvitationToken(
    data: TeacherInvitationData
  ): Promise<InvitationToken | null> {
    try {
      const token = this.generateSecureToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.TOKEN_EXPIRATION_DAYS);

      const admin = getSupabaseAdmin();

      // Check if there's already a pending invitation for this teacher
      const { data: existing } = await admin
        .from('invitation_tokens')
        .select('*')
        .eq('teacher_id', data.teacher_id)
        .eq('status', 'pending')
        .single();

      if (existing) {
        // Revoke old invitation
        await admin
          .from('invitation_tokens')
          .update({ status: 'revoked' })
          .eq('id', existing.id);
      }

      // Create new invitation token
      const { data: invitation, error } = await admin
        .from('invitation_tokens')
        .insert({
          token,
          teacher_id: data.teacher_id,
          parent_id: data.parent_id,
          email: data.teacher_email,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating invitation token:', error);
        return null;
      }

      return invitation;
    } catch (error) {
      console.error('Error in createInvitationToken:', error);
      return null;
    }
  }

  /**
   * Get invitation token by token string
   */
  static async getInvitationByToken(
    token: string
  ): Promise<InvitationToken | null> {
    try {
      const admin = getSupabaseAdmin();

      const { data, error } = await admin
        .from('invitation_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) {
        return null;
      }

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        // Auto-expire
        await admin
          .from('invitation_tokens')
          .update({ status: 'expired' })
          .eq('id', data.id);

        return { ...data, status: 'expired' };
      }

      return data;
    } catch (error) {
      console.error('Error getting invitation:', error);
      return null;
    }
  }

  /**
   * Accept an invitation and create Supabase Auth user for teacher
   */
  static async acceptInvitation(
    token: string,
    password: string
  ): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      const admin = getSupabaseAdmin();

      // Get invitation
      const invitation = await this.getInvitationByToken(token);

      if (!invitation) {
        return { success: false, error: 'Invalid invitation token' };
      }

      if (invitation.status !== 'pending') {
        return { success: false, error: `Invitation is ${invitation.status}` };
      }

      if (new Date(invitation.expires_at) < new Date()) {
        return { success: false, error: 'Invitation has expired' };
      }

      // Get teacher details
      const { data: teacher, error: teacherError } = await admin
        .from('teachers')
        .select('*')
        .eq('id', invitation.teacher_id)
        .single();

      if (teacherError || !teacher) {
        return { success: false, error: 'Teacher not found' };
      }

      // Check if user already exists with this email
      const { data: existingUser } = await admin.auth.admin.listUsers();
      const userExists = existingUser.users.some(
        u => u.email === invitation.email
      );

      if (userExists) {
        return { success: false, error: 'User with this email already exists' };
      }

      // Create Supabase Auth user
      const { data: authUser, error: authError } =
        await admin.auth.admin.createUser({
          email: invitation.email,
          password: password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: teacher.name,
            role: 'teacher',
          },
        });

      if (authError || !authUser) {
        console.error('Error creating auth user:', authError);
        return {
          success: false,
          error: authError?.message || 'Failed to create user account',
        };
      }

      // Create user entry in users table
      const { error: userInsertError } = await admin.from('users').insert({
        id: authUser.user.id,
        email: invitation.email,
        name: teacher.name,
        role: 'teacher',
        preferences: {},
      });

      if (userInsertError) {
        console.error('Error creating user record:', userInsertError);
        // Rollback: Delete auth user
        await admin.auth.admin.deleteUser(authUser.user.id);
        return { success: false, error: 'Failed to create user record' };
      }

      // Update teacher record with user_id
      const { error: teacherUpdateError } = await admin
        .from('teachers')
        .update({ user_id: authUser.user.id })
        .eq('id', invitation.teacher_id);

      if (teacherUpdateError) {
        console.error('Error updating teacher:', teacherUpdateError);
        // Note: We don't rollback here as the user is created
        // Teacher can still use the account, admin can manually link later
      }

      // Mark invitation as accepted
      await admin
        .from('invitation_tokens')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      return { success: true, userId: authUser.user.id };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Revoke an invitation
   */
  static async revokeInvitation(
    invitationId: string,
    parentId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('invitation_tokens')
        .update({ status: 'revoked' })
        .eq('id', invitationId)
        .eq('parent_id', parentId); // Ensure parent can only revoke their own

      return !error;
    } catch (error) {
      console.error('Error revoking invitation:', error);
      return false;
    }
  }

  /**
   * Get all invitations for a parent
   */
  static async getParentInvitations(
    parentId: string
  ): Promise<InvitationToken[]> {
    try {
      const { data, error } = await supabase
        .from('invitation_tokens')
        .select('*')
        .eq('parent_id', parentId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching invitations:', error);
      return [];
    }
  }

  /**
   * Resend invitation (creates new token, revokes old one)
   */
  static async resendInvitation(
    teacherId: string,
    parentId: string
  ): Promise<InvitationToken | null> {
    try {
      const admin = getSupabaseAdmin();

      // Get teacher details
      const { data: teacher, error: teacherError } = await admin
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .eq('parent_id', parentId)
        .single();

      if (teacherError || !teacher) {
        return null;
      }

      // Get parent details
      const { data: parent, error: parentError } = await admin
        .from('users')
        .select('*')
        .eq('id', parentId)
        .single();

      if (parentError || !parent) {
        return null;
      }

      // Create new invitation (this will auto-revoke existing pending invitations)
      return await this.createInvitationToken({
        teacher_id: teacherId,
        parent_id: parentId,
        teacher_email: teacher.email,
        teacher_name: teacher.name,
        parent_name: parent.name,
      });
    } catch (error) {
      console.error('Error resending invitation:', error);
      return null;
    }
  }

  /**
   * Generate invitation URL for email
   */
  static generateInvitationUrl(token: string, baseUrl: string): string {
    return `${baseUrl}/accept-invitation?token=${token}`;
  }

  /**
   * Clean up expired invitations (should be run periodically)
   */
  static async cleanupExpiredInvitations(): Promise<number> {
    try {
      const admin = getSupabaseAdmin();

      const { data, error } = await admin
        .from('invitation_tokens')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('expires_at', new Date().toISOString())
        .select();

      if (error) {
        console.error('Error cleaning up expired invitations:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in cleanupExpiredInvitations:', error);
      return 0;
    }
  }
}
