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
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  fromEmail?: string;
  fromName?: string;
}

class EmailService {
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  /**
   * Send contact request notification to administrator
   */
  async sendContactNotification(
    contactRequest: ContactRequest
  ): Promise<boolean> {
    try {
      // In a real implementation, this would use a service like:
      // - SendGrid
      // - AWS SES
      // - Nodemailer with SMTP
      // - Resend
      // - Mailgun

      const emailContent = this.generateContactEmailContent(contactRequest);

      console.log('Sending contact notification to:', this.config.adminEmail);
      console.log('Email content:', emailContent);

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));

      return true;
    } catch (error) {
      console.error('Failed to send contact notification:', error);
      return false;
    }
  }

  /**
   * Send confirmation email to the user who submitted the contact request
   */
  async sendConfirmationEmail(
    contactRequest: ContactRequest
  ): Promise<boolean> {
    try {
      const emailContent =
        this.generateConfirmationEmailContent(contactRequest);

      console.log('Sending confirmation email to:', contactRequest.email);
      console.log('Email content:', emailContent);

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000));

      return true;
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      return false;
    }
  }

  /**
   * Generate email content for contact notification
   */
  private generateContactEmailContent(contactRequest: ContactRequest): string {
    return `
New Contact Request - Gurukool Homeschool Platform

Request ID: ${contactRequest.id}
Timestamp: ${new Date(contactRequest.timestamp).toLocaleString()}

Contact Information:
- Name: ${contactRequest.name}
- Email: ${contactRequest.email}
- Phone: ${contactRequest.phone || 'Not provided'}
- Organization: ${contactRequest.organization || 'Not provided'}

Request Type: ${contactRequest.requestType}

Message:
${contactRequest.message}

---
This is an automated notification from the Gurukool Homeschool Platform.
Please respond to ${contactRequest.email} within 24-48 hours.
    `.trim();
  }

  /**
   * Generate confirmation email content
   */
  private generateConfirmationEmailContent(
    contactRequest: ContactRequest
  ): string {
    return `
Thank you for contacting Gurukool Homeschool Platform

Dear ${contactRequest.name},

We have received your contact request and will get back to you within 24-48 hours.

Request Details:
- Request ID: ${contactRequest.id}
- Request Type: ${contactRequest.requestType}
- Submitted: ${new Date(contactRequest.timestamp).toLocaleString()}

Your Message:
${contactRequest.message}

If you have any urgent questions, please contact us directly at ${this.config.adminEmail}.

Best regards,
The Gurukool Team
    `.trim();
  }

  /**
   * Process a contact request (send notifications)
   */
  async processContactRequest(contactRequest: ContactRequest): Promise<{
    adminNotificationSent: boolean;
    userConfirmationSent: boolean;
  }> {
    const adminNotificationSent =
      await this.sendContactNotification(contactRequest);
    const userConfirmationSent =
      await this.sendConfirmationEmail(contactRequest);

    return {
      adminNotificationSent,
      userConfirmationSent,
    };
  }
}

// Create default email service instance
export const emailService = new EmailService({
  adminEmail: 'abhishekumane@gmail.com',
  fromEmail: 'noreply@gurukool.com',
  fromName: 'Gurukool Homeschool Platform',
});

export default EmailService;
