/**
 * Email Service with Resend Integration
 * Handles all email communications for the platform
 */

import { Resend } from 'resend';

// Types
export interface ContactRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  message: string;
  requestType: string;
  adminEmail: string;
  timestamp: string;
  status: 'pending' | 'processed' | 'replied';
}

export interface EmailConfig {
  adminEmail: string;
  fromEmail: string;
  fromName: string;
  resendApiKey?: string;
}

export interface InvitationEmailData {
  teacherEmail: string;
  teacherName?: string;
  parentName: string;
  invitationUrl: string;
  expiresAt: Date;
  message?: string;
}

export interface SessionNotificationData {
  recipientEmail: string;
  recipientName: string;
  sessionType: 'check_in' | 'check_out' | 'reminder' | 'cancelled';
  teacherName: string;
  studentName: string;
  sessionTime: Date;
  location?: string;
  notes?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private config: EmailConfig;
  private resend: Resend | null = null;
  private isDevelopment: boolean;

  constructor(config: EmailConfig) {
    this.config = config;
    this.isDevelopment = process.env.NODE_ENV !== 'production';

    // Initialize Resend if API key is provided
    const apiKey = config.resendApiKey || process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  /**
   * Send an email using Resend API
   */
  private async sendEmail(
    to: string | string[],
    subject: string,
    html: string,
    text?: string
  ): Promise<EmailResult> {
    const recipients = Array.isArray(to) ? to : [to];

    // In development without API key, log instead of sending
    if (!this.resend) {
      console.log('='.repeat(60));
      console.log('[EMAIL SERVICE] Development Mode - Email would be sent:');
      console.log(`To: ${recipients.join(', ')}`);
      console.log(`Subject: ${subject}`);
      console.log(`From: ${this.config.fromName} <${this.config.fromEmail}>`);
      console.log('-'.repeat(60));
      console.log(text || html);
      console.log('='.repeat(60));

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
      };
    }

    try {
      const emailOptions: {
        from: string;
        to: string[];
        subject: string;
        html: string;
        text?: string;
      } = {
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: recipients,
        subject,
        html,
      };

      // Only add text if it's defined
      if (text) {
        emailOptions.text = text;
      }

      const { data, error } = await this.resend.emails.send(emailOptions);

      if (error) {
        console.error('Resend API error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send teacher invitation email
   */
  async sendTeacherInvitation(data: InvitationEmailData): Promise<EmailResult> {
    const {
      teacherEmail,
      teacherName,
      parentName,
      invitationUrl,
      expiresAt,
      message,
    } = data;

    const subject = `You've been invited to join GuruKool HomeSchool`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Teacher Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">GuruKool HomeSchool</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Teacher Invitation</p>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <h2 style="color: #1f2937; margin-top: 0;">Hello${teacherName ? ` ${teacherName}` : ''}!</h2>

    <p><strong>${parentName}</strong> has invited you to join GuruKool HomeSchool as a teacher.</p>

    ${message ? `<div style="background: #fff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;"><p style="margin: 0; font-style: italic;">"${message}"</p></div>` : ''}

    <p>GuruKool HomeSchool is a comprehensive platform for managing homeschool education, featuring:</p>
    <ul style="color: #4b5563;">
      <li>Session tracking and timesheets</li>
      <li>QR code-based check-in/check-out</li>
      <li>Student progress monitoring</li>
      <li>AI-powered insights</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${invitationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px;">
      This invitation expires on <strong>${expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
      If you didn't expect this invitation, you can safely ignore this email.
      <br>
      If the button doesn't work, copy and paste this link: <a href="${invitationUrl}" style="color: #667eea;">${invitationUrl}</a>
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} GuruKool HomeSchool. All rights reserved.</p>
  </div>
</body>
</html>
    `.trim();

    const text = `
Hello${teacherName ? ` ${teacherName}` : ''}!

${parentName} has invited you to join GuruKool HomeSchool as a teacher.

${message ? `Message from ${parentName}: "${message}"` : ''}

GuruKool HomeSchool is a comprehensive platform for managing homeschool education, featuring:
- Session tracking and timesheets
- QR code-based check-in/check-out
- Student progress monitoring
- AI-powered insights

Accept your invitation here: ${invitationUrl}

This invitation expires on ${expiresAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.

If you didn't expect this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} GuruKool HomeSchool
    `.trim();

    return this.sendEmail(teacherEmail, subject, html, text);
  }

  /**
   * Send session notification (check-in, check-out, reminder, cancelled)
   */
  async sendSessionNotification(
    data: SessionNotificationData
  ): Promise<EmailResult> {
    const {
      recipientEmail,
      recipientName,
      sessionType,
      teacherName,
      studentName,
      sessionTime,
      location,
      notes,
    } = data;

    const typeLabels = {
      check_in: {
        subject: 'Session Started',
        action: 'has checked in',
        color: '#10b981',
      },
      check_out: {
        subject: 'Session Completed',
        action: 'has checked out',
        color: '#3b82f6',
      },
      reminder: {
        subject: 'Session Reminder',
        action: 'has an upcoming session',
        color: '#f59e0b',
      },
      cancelled: {
        subject: 'Session Cancelled',
        action: 'session has been cancelled',
        color: '#ef4444',
      },
    };

    const typeInfo = typeLabels[sessionType];
    const subject = `[GuruKool] ${typeInfo.subject}: ${teacherName} with ${studentName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${typeInfo.color}; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${typeInfo.subject}</h1>
  </div>

  <div style="background: #f9fafb; padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p>Hello ${recipientName},</p>

    <p><strong>${teacherName}</strong> ${typeInfo.action} for a session with <strong>${studentName}</strong>.</p>

    <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Time:</strong> ${sessionTime.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}</p>
      ${location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>` : ''}
      ${notes ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${notes}</p>` : ''}
    </div>

    <p style="color: #6b7280; font-size: 14px;">
      View full session details in your <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://gurukool.app'}/parent/dashboard" style="color: ${typeInfo.color};">GuruKool dashboard</a>.
    </p>
  </div>
</body>
</html>
    `.trim();

    const text = `
${typeInfo.subject}

Hello ${recipientName},

${teacherName} ${typeInfo.action} for a session with ${studentName}.

Time: ${sessionTime.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
${location ? `Location: ${location}` : ''}
${notes ? `Notes: ${notes}` : ''}

View full session details in your GuruKool dashboard.
    `.trim();

    return this.sendEmail(recipientEmail, subject, html, text);
  }

  /**
   * Send contact request notification to administrator
   */
  async sendContactNotification(
    contactRequest: ContactRequest
  ): Promise<EmailResult> {
    const subject = `[GuruKool Contact] ${contactRequest.requestType} from ${contactRequest.name}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1f2937; border-bottom: 2px solid #667eea; padding-bottom: 10px;">New Contact Request</h2>

  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 8px 0; color: #6b7280; width: 120px;">Request ID:</td>
      <td style="padding: 8px 0;"><code>${contactRequest.id}</code></td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #6b7280;">Name:</td>
      <td style="padding: 8px 0;"><strong>${contactRequest.name}</strong></td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #6b7280;">Email:</td>
      <td style="padding: 8px 0;"><a href="mailto:${contactRequest.email}">${contactRequest.email}</a></td>
    </tr>
    ${contactRequest.phone ? `<tr><td style="padding: 8px 0; color: #6b7280;">Phone:</td><td style="padding: 8px 0;">${contactRequest.phone}</td></tr>` : ''}
    ${contactRequest.organization ? `<tr><td style="padding: 8px 0; color: #6b7280;">Organization:</td><td style="padding: 8px 0;">${contactRequest.organization}</td></tr>` : ''}
    <tr>
      <td style="padding: 8px 0; color: #6b7280;">Type:</td>
      <td style="padding: 8px 0;"><span style="background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 14px;">${contactRequest.requestType}</span></td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #6b7280;">Submitted:</td>
      <td style="padding: 8px 0;">${new Date(contactRequest.timestamp).toLocaleString()}</td>
    </tr>
  </table>

  <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
    <h3 style="margin: 0 0 10px 0; color: #374151;">Message:</h3>
    <p style="margin: 0; white-space: pre-wrap;">${contactRequest.message}</p>
  </div>

  <p style="color: #9ca3af; font-size: 12px; margin-top: 30px;">
    Please respond to ${contactRequest.email} within 24-48 hours.
  </p>
</body>
</html>
    `.trim();

    const text = `
New Contact Request - GuruKool HomeSchool

Request ID: ${contactRequest.id}
Submitted: ${new Date(contactRequest.timestamp).toLocaleString()}

Contact Information:
- Name: ${contactRequest.name}
- Email: ${contactRequest.email}
- Phone: ${contactRequest.phone || 'Not provided'}
- Organization: ${contactRequest.organization || 'Not provided'}

Request Type: ${contactRequest.requestType}

Message:
${contactRequest.message}

---
Please respond to ${contactRequest.email} within 24-48 hours.
    `.trim();

    return this.sendEmail(this.config.adminEmail, subject, html, text);
  }

  /**
   * Send confirmation email to user who submitted contact request
   */
  async sendContactConfirmation(
    contactRequest: ContactRequest
  ): Promise<EmailResult> {
    const subject = `We've received your message - GuruKool HomeSchool`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">Thank You!</h1>
  </div>

  <div style="background: #f9fafb; padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p>Dear ${contactRequest.name},</p>

    <p>We've received your message and will get back to you within <strong>24-48 hours</strong>.</p>

    <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Reference ID: <code>${contactRequest.id}</code></p>
      <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">Request Type: ${contactRequest.requestType}</p>
    </div>

    <p style="color: #6b7280; font-size: 14px;">
      If you have urgent questions, please contact us directly at <a href="mailto:${this.config.adminEmail}" style="color: #667eea;">${this.config.adminEmail}</a>.
    </p>

    <p>Best regards,<br><strong>The GuruKool Team</strong></p>
  </div>
</body>
</html>
    `.trim();

    const text = `
Thank you for contacting GuruKool HomeSchool!

Dear ${contactRequest.name},

We've received your message and will get back to you within 24-48 hours.

Reference ID: ${contactRequest.id}
Request Type: ${contactRequest.requestType}

If you have urgent questions, please contact us directly at ${this.config.adminEmail}.

Best regards,
The GuruKool Team
    `.trim();

    return this.sendEmail(contactRequest.email, subject, html, text);
  }

  /**
   * Process a contact request (send both admin notification and user confirmation)
   */
  async processContactRequest(contactRequest: ContactRequest): Promise<{
    adminNotificationSent: boolean;
    userConfirmationSent: boolean;
  }> {
    const [adminResult, userResult] = await Promise.all([
      this.sendContactNotification(contactRequest),
      this.sendContactConfirmation(contactRequest),
    ]);

    return {
      adminNotificationSent: adminResult.success,
      userConfirmationSent: userResult.success,
    };
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(
    email: string,
    resetUrl: string
  ): Promise<EmailResult> {
    const subject = 'Reset your GuruKool password';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0;">Password Reset</h1>
  </div>

  <div style="background: #f9fafb; padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p>You requested a password reset for your GuruKool account.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Reset Password
      </a>
    </div>

    <p style="color: #6b7280; font-size: 14px;">
      This link expires in 1 hour. If you didn't request this reset, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
    `.trim();

    return this.sendEmail(email, subject, html);
  }

  /**
   * Check if email service is properly configured
   */
  isConfigured(): boolean {
    return this.resend !== null;
  }

  /**
   * Get service status
   */
  getStatus(): { configured: boolean; mode: string } {
    return {
      configured: this.isConfigured(),
      mode: this.resend ? 'production' : 'development',
    };
  }
}

// Create default email service instance
export const emailService = new EmailService({
  adminEmail: process.env.ADMIN_EMAIL || 'abhishekumane@gmail.com',
  fromEmail: process.env.EMAIL_FROM || 'noreply@gurukool.app',
  fromName: process.env.EMAIL_FROM_NAME || 'GuruKool HomeSchool',
});

export default EmailService;
