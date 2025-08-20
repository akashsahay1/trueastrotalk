import sgMail from '@sendgrid/mail';
import { envConfig } from './env-config';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  constructor() {
    if (envConfig.SENDGRID_API_KEY) {
      sgMail.setApiKey(envConfig.SENDGRID_API_KEY);
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (!envConfig.SENDGRID_API_KEY) {
        console.warn('SendGrid API key not configured, email not sent');
        return false;
      }

      const msg = {
        to: emailData.to,
        from: {
          email: envConfig.SMTP.USER || 'noreply@trueastrotalk.com',
          name: 'True Astrotalk'
        },
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      };

      const result = await sgMail.send(msg);
      console.log('Email sent successfully via SendGrid:', result[0].statusCode);
      return true;
    } catch (error) {
      console.error('Error sending email via SendGrid:', error);
      return false;
    }
  }

  // Template: Admin notification for new user signup
  getAdminSignupNotificationTemplate(user: { name: string; email: string; phone?: string; user_type: string; createdAt?: string | Date; experience?: string; specialization?: string }): EmailTemplate {
    return {
      subject: `New User Registration - ${user.name}`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New User Registration</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .user-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
            .info-row { margin: 10px 0; }
            .label { font-weight: bold; color: #555; }
            .value { margin-left: 10px; }
            .action-required { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌟 New User Registration</h1>
              <p>A new user has registered on True Astrotalk</p>
            </div>
            <div class="content">
              <div class="user-info">
                <h3>User Details</h3>
                <div class="info-row">
                  <span class="label">Name:</span>
                  <span class="value">${user.name}</span>
                </div>
                <div class="info-row">
                  <span class="label">Email:</span>
                  <span class="value">${user.email}</span>
                </div>
                <div class="info-row">
                  <span class="label">Phone:</span>
                  <span class="value">${user.phone}</span>
                </div>
                <div class="info-row">
                  <span class="label">User Type:</span>
                  <span class="value">${user.user_type}</span>
                </div>
                <div class="info-row">
                  <span class="label">Registration Date:</span>
                  <span class="value">${new Date(user.createdAt || Date.now()).toLocaleString()}</span>
                </div>
                ${user.user_type === 'astrologer' ? `
                <div class="info-row">
                  <span class="label">Experience:</span>
                  <span class="value">${user.experience || 'N/A'} years</span>
                </div>
                <div class="info-row">
                  <span class="label">Specialization:</span>
                  <span class="value">${user.specialization || 'N/A'}</span>
                </div>
                ` : ''}
              </div>

              ${user.user_type === 'astrologer' ? `
              <div class="action-required">
                <h4>⚠️ Action Required</h4>
                <p>This astrologer registration requires your review and approval. Please log in to the admin panel to verify their credentials and approve or reject their application.</p>
                <a href="${envConfig.NEXTAUTH_URL}/admin/accounts/astrologers" class="btn">Review Application</a>
              </div>
              ` : ''}

              <div class="footer">
                <p>This is an automated notification from True Astrotalk Admin System</p>
                <p>Please do not reply to this email</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        New User Registration - ${user.name}
        
        A new user has registered on True Astrotalk:
        
        Name: ${user.name}
        Email: ${user.email}
        Phone: ${user.phone}
        User Type: ${user.user_type}
        Registration Date: ${new Date(user.createdAt || Date.now()).toLocaleString()}
        
        ${user.user_type === 'astrologer' ? 'This astrologer registration requires your review and approval.' : ''}
        
        Admin Panel: ${envConfig.NEXTAUTH_URL}/admin
      `
    };
  }

  // Template: Welcome email for new users
  getWelcomeEmailTemplate(user: { name: string; email: string; user_type: string; createdAt?: string | Date }): EmailTemplate {
    return {
      subject: `Welcome to True Astrotalk, ${user.name}!`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to True Astrotalk</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .welcome-msg { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature-item { margin: 15px 0; padding: 10px; border-left: 3px solid #667eea; }
            .btn { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .status-note { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌟 Welcome to True Astrotalk!</h1>
              <p>Your spiritual journey begins here</p>
            </div>
            <div class="content">
              <div class="welcome-msg">
                <h2>Hello ${user.name},</h2>
                <p>Thank you for joining True Astrotalk! We're excited to have you as part of our spiritual community.</p>
              </div>

              ${user.user_type === 'astrologer' ? `
              <div class="status-note">
                <h4>📋 Application Under Review</h4>
                <p>Your astrologer application is currently being reviewed by our admin team. You will receive an email notification once your account is verified and approved. This process typically takes 1-2 business days.</p>
              </div>
              ` : ''}

              <div class="features">
                <h3>What's Next?</h3>
                ${user.user_type === 'customer' ? `
                <div class="feature-item">
                  <strong>🔮 Explore Astrologers:</strong> Browse our verified astrologers and find the perfect match for your spiritual needs.
                </div>
                <div class="feature-item">
                  <strong>💬 Start Consultations:</strong> Book consultations with experienced astrologers through chat, call, or video.
                </div>
                <div class="feature-item">
                  <strong>📊 Track Your Journey:</strong> Keep track of your consultations and spiritual growth.
                </div>
                ` : user.user_type === 'astrologer' ? `
                <div class="feature-item">
                  <strong>✅ Complete Verification:</strong> Once approved, complete your profile with your expertise and availability.
                </div>
                <div class="feature-item">
                  <strong>💼 Start Earning:</strong> Begin accepting consultations and building your client base.
                </div>
                <div class="feature-item">
                  <strong>📈 Grow Your Practice:</strong> Use our platform tools to manage appointments and track earnings.
                </div>
                ` : ''}
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${envConfig.NEXTAUTH_URL}" class="btn">Visit Platform</a>
              </div>

              <div class="footer">
                <p>Need help? Contact our support team anytime.</p>
                <p>Thank you for choosing True Astrotalk!</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to True Astrotalk, ${user.name}!
        
        Thank you for joining True Astrotalk! We're excited to have you as part of our spiritual community.
        
        ${user.user_type === 'astrologer' ? 'Your astrologer application is currently being reviewed by our admin team. You will receive an email notification once your account is verified and approved.' : ''}
        
        Visit our platform: ${envConfig.NEXTAUTH_URL}
        
        Need help? Contact our support team anytime.
        Thank you for choosing True Astrotalk!
      `
    };
  }

  // Template: Astrologer verification/rejection notification
  getAstrologerStatusTemplate(astrologer: { name: string; email: string }, status: 'verified' | 'rejected', reason?: string): EmailTemplate {
    const isVerified = status === 'verified';
    
    return {
      subject: `Application ${isVerified ? 'Approved' : 'Update'} - True Astrotalk`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Application Status Update</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${isVerified ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .status-box { background: ${isVerified ? '#d4edda' : '#f8d7da'}; border: 1px solid ${isVerified ? '#c3e6cb' : '#f5c6cb'}; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .next-steps { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .step-item { margin: 15px 0; padding: 10px; border-left: 3px solid ${isVerified ? '#667eea' : '#dc3545'}; }
            .btn { display: inline-block; padding: 12px 24px; background: ${isVerified ? '#28a745' : '#6c757d'}; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .reason-box { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isVerified ? '🎉 Congratulations!' : '📋 Application Update'}</h1>
              <p>Your astrologer application has been ${isVerified ? 'approved' : 'reviewed'}</p>
            </div>
            <div class="content">
              <div class="status-box">
                <h2>${isVerified ? '✅ Application Approved' : '❌ Application Status'}</h2>
                <p>Hello ${astrologer.name},</p>
                <p>${isVerified ? 
                  'We are pleased to inform you that your astrologer application has been approved! Welcome to the True Astrotalk family.' : 
                  'After careful review, we regret to inform you that your astrologer application requires additional review or has been declined.'
                }</p>
              </div>

              ${!isVerified && reason ? `
              <div class="reason-box">
                <h4>📝 Feedback</h4>
                <p>${reason}</p>
              </div>
              ` : ''}

              <div class="next-steps">
                <h3>${isVerified ? 'Next Steps' : 'What You Can Do'}</h3>
                ${isVerified ? `
                <div class="step-item">
                  <strong>📱 Login to the App:</strong> Open the True Astrotalk mobile app and login with your credentials to complete your profile.
                </div>
                <div class="step-item">
                  <strong>🔧 Complete Your Profile:</strong> Add your expertise, experience, and availability details in the app.
                </div>
                <div class="step-item">
                  <strong>💼 Start Accepting Consultations:</strong> You can now receive and accept consultation requests from clients through the app.
                </div>
                ` : `
                <div class="step-item">
                  <strong>📧 Contact Support:</strong> If you have questions about this decision, please contact our support team.
                </div>
                <div class="step-item">
                  <strong>🔄 Reapply:</strong> You may reapply after addressing the feedback provided above.
                </div>
                `}
              </div>

              <div style="text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                ${isVerified ? 
                  `<p style="margin: 0; font-size: 16px; color: #667eea; font-weight: bold;">📱 Please login to the True Astrotalk mobile app to get started!</p>` : 
                  `<p style="margin: 0; font-size: 16px; color: #666;">If you have any questions, please contact our support team.</p>`
                }
              </div>

              <div class="footer">
                <p>${isVerified ? 'Welcome to True Astrotalk! We look forward to your success on our platform.' : 'Thank you for your interest in True Astrotalk.'}</p>
                <p>If you have any questions, please don't hesitate to contact our support team.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Application ${isVerified ? 'Approved' : 'Update'} - True Astrotalk
        
        Hello ${astrologer.name},
        
        ${isVerified ? 
          'We are pleased to inform you that your astrologer application has been approved! Welcome to the True Astrotalk family.' : 
          'After careful review, we regret to inform you that your astrologer application requires additional review or has been declined.'
        }
        
        ${!isVerified && reason ? `Feedback: ${reason}` : ''}
        
        ${isVerified ? 
          'You can now login to the True Astrotalk mobile app and start accepting consultations.' : 
          'If you have questions about this decision, please contact our support team.'
        }
        
        Platform: ${envConfig.NEXTAUTH_URL}
        
        Thank you,
        True Astrotalk Team
      `
    };
  }

  // Send admin notification for new user signup
  async sendAdminSignupNotification(user: { name: string; email: string; phone?: string; user_type: string; createdAt?: string | Date }): Promise<boolean> {
    const adminEmail = envConfig.SMTP.USER || 'admin@trueastrotalk.com'; // Admin email
    const template = this.getAdminSignupNotificationTemplate(user);
    
    return await this.sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  // Send welcome email to new user
  async sendWelcomeEmail(user: { name: string; email: string; user_type: string; createdAt?: string | Date }): Promise<boolean> {
    const template = this.getWelcomeEmailTemplate(user);
    
    return await this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  // Send astrologer status notification
  async sendAstrologerStatusNotification(astrologer: { name: string; email: string }, status: 'verified' | 'rejected', reason?: string): Promise<boolean> {
    const template = this.getAstrologerStatusTemplate(astrologer, status, reason);
    
    return await this.sendEmail({
      to: astrologer.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }
}

export const emailService = new EmailService();