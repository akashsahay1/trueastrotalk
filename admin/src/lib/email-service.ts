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
  private logoUrl: string;

  constructor() {
    if (envConfig.SENDGRID_API_KEY) {
      sgMail.setApiKey(envConfig.SENDGRID_API_KEY);
    }
    // Logo URL for email templates
    this.logoUrl = `${envConfig.NEXTAUTH_URL}/logo.png`;
  }

  // Common email header with logo
  private getEmailHeader(title: string, subtitle?: string): string {
    return `
      <div style="text-align: center; padding: 30px 20px; background: #ffffff; border-bottom: 3px solid #667eea;">
        <img src="${this.logoUrl}" alt="True Astrotalk" style="max-width: 180px; height: auto; margin-bottom: 15px;" />
        <h1 style="color: #2c3e50; margin: 0; font-size: 24px;">${title}</h1>
        ${subtitle ? `<p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">${subtitle}</p>` : ''}
      </div>
    `;
  }

  // Common email footer
  private getEmailFooter(): string {
    return `
      <div style="text-align: center; padding: 20px; background: #f8f9fa; border-top: 1px solid #e9ecef;">
        <p style="color: #666; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} True Astrotalk. All rights reserved.
        </p>
        <p style="color: #999; font-size: 11px; margin: 10px 0 0 0;">
          This is an automated email. Please do not reply to this message.
        </p>
      </div>
    `;
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
          email: envConfig.SEND_FROM || 'noreply@trueastrotalk.com',
          name: 'True Astrotalk'
        },
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      };

      const _result = await sgMail.send(msg);
      console.log('Email sent successfully to:', emailData.to);
      return true;
    } catch (error: unknown) {
      console.error('Error sending email via SendGrid:');
      // Log detailed error information from SendGrid
      if (error && typeof error === 'object' && 'response' in error) {
        const sgError = error as { code?: number; response?: { body?: unknown; headers?: unknown } };
        console.error('Status Code:', sgError.code);
        console.error('Response Body:', JSON.stringify(sgError.response?.body, null, 2));
      } else {
        console.error('Error details:', error);
      }
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
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            ${this.getEmailHeader('New User Registration', 'A new user has registered on True Astrotalk')}

            <div style="padding: 30px;">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
                <h3 style="margin: 0 0 15px 0; color: #2c3e50;">User Details</h3>
                <p style="margin: 8px 0;"><strong>Name:</strong> ${user.name}</p>
                <p style="margin: 8px 0;"><strong>Email:</strong> ${user.email}</p>
                <p style="margin: 8px 0;"><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
                <p style="margin: 8px 0;"><strong>User Type:</strong> ${user.user_type}</p>
                <p style="margin: 8px 0;"><strong>Registration Date:</strong> ${new Date(user.createdAt || Date.now()).toLocaleString()}</p>
                ${user.user_type === 'astrologer' ? `
                <p style="margin: 8px 0;"><strong>Experience:</strong> ${user.experience || 'N/A'} years</p>
                <p style="margin: 8px 0;"><strong>Specialization:</strong> ${user.specialization || 'N/A'}</p>
                ` : ''}
              </div>

              ${user.user_type === 'astrologer' ? `
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #856404;">⚠️ Action Required</h4>
                <p style="margin: 0 0 15px 0; color: #856404;">This astrologer registration requires your review and approval.</p>
                <a href="${envConfig.NEXTAUTH_URL}/accounts/astrologers" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">Review Application</a>
              </div>
              ` : ''}
            </div>

            ${this.getEmailFooter()}
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
        
        Admin Panel: ${envConfig.NEXTAUTH_URL}
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
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            ${this.getEmailHeader('Welcome to True Astrotalk!', 'Your spiritual journey begins here')}

            <div style="padding: 30px;">
              <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #2c3e50; margin: 0;">Hello ${user.name},</h2>
                <p style="color: #666; margin: 10px 0 0 0;">Thank you for joining True Astrotalk! We're excited to have you as part of our spiritual community.</p>
              </div>

              ${user.user_type === 'astrologer' ? `
              <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #0c5460;">📋 Application Under Review</h4>
                <p style="margin: 0; color: #0c5460;">Your astrologer application is currently being reviewed by our admin team. You will receive an email notification once your account is verified and approved. This process typically takes 1-2 business days.</p>
              </div>
              ` : ''}

              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h3 style="margin: 0 0 15px 0; color: #2c3e50;">What's Next?</h3>
                ${user.user_type === 'customer' ? `
                <div style="padding: 10px 0; border-left: 3px solid #667eea; padding-left: 15px; margin-bottom: 10px;">
                  <strong>🔮 Explore Astrologers:</strong> Browse our verified astrologers and find the perfect match for your spiritual needs.
                </div>
                <div style="padding: 10px 0; border-left: 3px solid #667eea; padding-left: 15px; margin-bottom: 10px;">
                  <strong>💬 Start Consultations:</strong> Book consultations with experienced astrologers through chat, call, or video.
                </div>
                <div style="padding: 10px 0; border-left: 3px solid #667eea; padding-left: 15px;">
                  <strong>📊 Track Your Journey:</strong> Keep track of your consultations and spiritual growth.
                </div>
                ` : user.user_type === 'astrologer' ? `
                <div style="padding: 10px 0; border-left: 3px solid #667eea; padding-left: 15px; margin-bottom: 10px;">
                  <strong>✅ Complete Verification:</strong> Once approved, complete your profile with your expertise and availability.
                </div>
                <div style="padding: 10px 0; border-left: 3px solid #667eea; padding-left: 15px; margin-bottom: 10px;">
                  <strong>💼 Start Earning:</strong> Begin accepting consultations and building your client base.
                </div>
                <div style="padding: 10px 0; border-left: 3px solid #667eea; padding-left: 15px;">
                  <strong>📈 Grow Your Practice:</strong> Use our platform tools to manage appointments and track earnings.
                </div>
                ` : ''}
              </div>

              <div style="text-align: center; margin: 25px 0;">
                <a href="${envConfig.NEXTAUTH_URL}" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">Visit Platform</a>
              </div>
            </div>

            ${this.getEmailFooter()}
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
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            ${this.getEmailHeader(isVerified ? 'Congratulations!' : 'Application Update', `Your astrologer application has been ${isVerified ? 'approved' : 'reviewed'}`)}

            <div style="padding: 30px;">
              <div style="background: ${isVerified ? '#d4edda' : '#f8d7da'}; border: 1px solid ${isVerified ? '#c3e6cb' : '#f5c6cb'}; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <h2 style="margin: 0 0 10px 0; color: ${isVerified ? '#155724' : '#721c24'};">${isVerified ? '✅ Application Approved' : '❌ Application Requires Attention'}</h2>
                <p style="margin: 0; color: ${isVerified ? '#155724' : '#721c24'};">Hello ${astrologer.name},</p>
                <p style="margin: 10px 0 0 0; color: ${isVerified ? '#155724' : '#721c24'};">${isVerified ?
                  'We are pleased to inform you that your astrologer application has been approved! Welcome to the True Astrotalk family.' :
                  'After careful review, we regret to inform you that your astrologer application requires additional review or has been declined.'
                }</p>
              </div>

              ${!isVerified && reason ? `
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #856404;">📝 Feedback</h4>
                <p style="margin: 0; color: #856404;">${reason}</p>
              </div>
              ` : ''}

              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h3 style="margin: 0 0 15px 0; color: #2c3e50;">${isVerified ? 'Next Steps' : 'What You Can Do'}</h3>
                ${isVerified ? `
                <div style="padding: 10px 0; border-left: 3px solid #28a745; padding-left: 15px; margin-bottom: 10px;">
                  <strong>📱 Login to the App:</strong> Open the True Astrotalk mobile app and login with your credentials to complete your profile.
                </div>
                <div style="padding: 10px 0; border-left: 3px solid #28a745; padding-left: 15px; margin-bottom: 10px;">
                  <strong>🔧 Complete Your Profile:</strong> Add your expertise, experience, and availability details in the app.
                </div>
                <div style="padding: 10px 0; border-left: 3px solid #28a745; padding-left: 15px;">
                  <strong>💼 Start Accepting Consultations:</strong> You can now receive and accept consultation requests from clients through the app.
                </div>
                ` : `
                <div style="padding: 10px 0; border-left: 3px solid #dc3545; padding-left: 15px; margin-bottom: 10px;">
                  <strong>📧 Contact Support:</strong> If you have questions about this decision, please contact our support team.
                </div>
                <div style="padding: 10px 0; border-left: 3px solid #dc3545; padding-left: 15px;">
                  <strong>🔄 Reapply:</strong> You may reapply after addressing the feedback provided above.
                </div>
                `}
              </div>

              <div style="text-align: center; margin: 25px 0; padding: 20px; background: #f8f9fa; border-radius: 8px;">
                ${isVerified ?
                  `<p style="margin: 0; font-size: 16px; color: #28a745; font-weight: bold;">📱 Please login to the True Astrotalk mobile app to get started!</p>` :
                  `<p style="margin: 0; font-size: 16px; color: #666;">If you have any questions, please contact our support team.</p>`
                }
              </div>
            </div>

            ${this.getEmailFooter()}
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
    const adminEmail = envConfig.SMTP.user || 'admin@trueastrotalk.com'; // Admin email
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

  // Template: Password reset email
  getForgotPasswordTemplate(user: { name: string; email: string }, resetToken: string): EmailTemplate {
    const resetUrl = `${envConfig.NEXTAUTH_URL}/reset-password?token=${resetToken}`;

    return {
      subject: 'Reset Your Password - True Astrotalk',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            ${this.getEmailHeader('Password Reset Request', 'Reset your True Astrotalk password')}

            <div style="padding: 30px;">
              <div style="text-align: center; margin-bottom: 25px;">
                <h2 style="color: #2c3e50; margin: 0;">Hello ${user.name},</h2>
                <p style="color: #666; margin: 10px 0;">We received a request to reset your password for your True Astrotalk account.</p>
                <p style="color: #666; margin: 10px 0;">Click the button below to reset your password:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold;">Reset Password</a>
              </div>

              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #856404;">🔒 Security Information</h4>
                <ul style="text-align: left; margin: 0; padding-left: 20px; color: #856404;">
                  <li>This link will expire in 15 minutes for security purposes</li>
                  <li>If you didn't request this reset, you can safely ignore this email</li>
                  <li>Your password won't be changed unless you click the link above</li>
                </ul>
              </div>

              <div style="background: #e9ecef; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-family: monospace; text-align: center;">
                <p style="margin: 0;"><strong>Reset Token:</strong> ${resetToken}</p>
                <p style="font-size: 12px; color: #666; margin: 10px 0 0 0;">You can also use this token in the mobile app if needed</p>
              </div>

              <div style="text-align: center; color: #666; font-size: 14px;">
                <p style="margin: 0;">If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
                <p style="word-break: break-all; color: #667eea; margin: 10px 0;">${resetUrl}</p>
              </div>
            </div>

            ${this.getEmailFooter()}
          </div>
        </body>
        </html>
      `,
      text: `
        Reset Your Password - True Astrotalk
        
        Hello ${user.name},
        
        We received a request to reset your password for your True Astrotalk account.
        
        Reset your password by clicking this link: ${resetUrl}
        
        Reset Token: ${resetToken}
        
        Security Information:
        - This link will expire in 15 minutes
        - If you didn't request this reset, you can ignore this email
        - Your password won't be changed unless you use the link above
        
        If you're having trouble with the link, copy and paste this URL into your browser:
        ${resetUrl}
        
        Thank you,
        True Astrotalk Team
      `
    };
  }

  // Send password reset email
  async sendPasswordResetEmail(user: { name: string; email: string }, resetToken: string): Promise<boolean> {
    const template = this.getForgotPasswordTemplate(user, resetToken);
    
    return await this.sendEmail({
      to: user.email,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  // Template: Order status change notification for customers
  getOrderStatusTemplate(orderData: {
    customerName: string;
    orderNumber: string;
    oldStatus?: string;
    newStatus: string;
    orderDate: string;
    totalAmount: number;
    trackingNumber?: string;
    items: Array<{
      product_name: string;
      quantity: number;
      price: number;
    }>;
  }): EmailTemplate {
    const statusMessages = {
      pending: 'Your order has been received and is being processed.',
      confirmed: 'Your order has been confirmed and will be processed soon.',
      processing: 'Your order is currently being prepared for shipment.',
      shipped: 'Great news! Your order has been shipped.',
      delivered: 'Your order has been delivered successfully.',
      cancelled: 'Your order has been cancelled.'
    };

    const statusColors = {
      pending: '#ffc107',
      confirmed: '#17a2b8',
      processing: '#007bff',
      shipped: '#28a745',
      delivered: '#28a745',
      cancelled: '#dc3545'
    };

    return {
      subject: `Order ${orderData.orderNumber} - Status Updated to ${orderData.newStatus.toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Order Status Update - ${orderData.orderNumber}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              ${this.getEmailHeader('Order Status Update', `Order #${orderData.orderNumber}`)}

              <div style="padding: 30px;">
                <p style="margin: 0 0 15px 0;">Dear ${orderData.customerName},</p>
                <p style="margin: 0 0 20px 0;">Your order status has been updated:</p>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid ${statusColors[orderData.newStatus as keyof typeof statusColors]}; margin-bottom: 20px;">
                  <div style="margin-bottom: 10px;">
                    <strong>Order #${orderData.orderNumber}</strong>
                    <span style="background: ${statusColors[orderData.newStatus as keyof typeof statusColors]}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; text-transform: uppercase; margin-left: 10px;">
                      ${orderData.newStatus}
                    </span>
                  </div>
                  <p style="margin: 0; color: #666;">
                    ${statusMessages[orderData.newStatus as keyof typeof statusMessages]}
                  </p>
                  ${orderData.trackingNumber ? `<p style="margin: 10px 0 0 0;"><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>` : ''}
                </div>

                <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 15px 0; color: #2c3e50;">Order Details</h3>
                  <p style="margin: 5px 0;"><strong>Order Date:</strong> ${orderData.orderDate}</p>
                  <p style="margin: 5px 0;"><strong>Total Amount:</strong> ₹${orderData.totalAmount.toLocaleString()}</p>

                  <h4 style="color: #2c3e50; border-bottom: 1px solid #e9ecef; padding-bottom: 5px; margin: 20px 0 10px 0;">Items Ordered</h4>
                  ${orderData.items.map(item => `
                    <div style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
                      <span>${item.product_name} (x${item.quantity})</span>
                      <span style="float: right;">₹${(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  `).join('')}
                </div>

                <div style="text-align: center; color: #666; font-size: 14px;">
                  <p style="margin: 0;">Thank you for shopping with True Astrotalk!</p>
                  <p style="margin: 5px 0 0 0;">If you have any questions, please contact our support team.</p>
                </div>
              </div>

              ${this.getEmailFooter()}
            </div>
          </body>
        </html>
      `,
      text: `
        Order Status Update - ${orderData.orderNumber}

        Dear ${orderData.customerName},

        Your order status has been updated to: ${orderData.newStatus.toUpperCase()}

        ${statusMessages[orderData.newStatus as keyof typeof statusMessages]}

        Order Details:
        - Order Number: ${orderData.orderNumber}
        - Order Date: ${orderData.orderDate}
        - Total Amount: ₹${orderData.totalAmount.toLocaleString()}
        ${orderData.trackingNumber ? `- Tracking Number: ${orderData.trackingNumber}` : ''}

        Items Ordered:
        ${orderData.items.map(item => `- ${item.product_name} (x${item.quantity}) - ₹${(item.price * item.quantity).toLocaleString()}`).join('\n')}

        Thank you for shopping with True Astrotalk!

        This is an automated email. Please do not reply.
      `
    };
  }

  // Template: Admin notification for order status changes
  getAdminOrderNotificationTemplate(orderData: {
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    oldStatus: string;
    newStatus: string;
    totalAmount: number;
    itemsCount: number;
    trackingNumber?: string;
  }): EmailTemplate {
    return {
      subject: `Admin: Order ${orderData.orderNumber} status changed to ${orderData.newStatus.toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Admin: Order Status Changed - ${orderData.orderNumber}</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              ${this.getEmailHeader('Order Status Changed', `Admin Notification`)}

              <div style="padding: 30px;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 8px 0;"><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                  <p style="margin: 8px 0;"><strong>Customer:</strong> ${orderData.customerName} (${orderData.customerEmail})</p>
                  <p style="margin: 8px 0;"><strong>Status Changed:</strong> ${orderData.oldStatus.toUpperCase()} → ${orderData.newStatus.toUpperCase()}</p>
                  <p style="margin: 8px 0;"><strong>Order Total:</strong> ₹${orderData.totalAmount.toLocaleString()}</p>
                  <p style="margin: 8px 0;"><strong>Items:</strong> ${orderData.itemsCount} item(s)</p>
                  ${orderData.trackingNumber ? `<p style="margin: 8px 0;"><strong>Tracking:</strong> ${orderData.trackingNumber}</p>` : ''}
                </div>

                <p style="color: #666; font-size: 14px; text-align: center; margin: 0;">
                  Customer has been automatically notified of this status change.
                </p>
              </div>

              ${this.getEmailFooter()}
            </div>
          </body>
        </html>
      `,
      text: `
        Order Status Changed

        Order Number: ${orderData.orderNumber}
        Customer: ${orderData.customerName} (${orderData.customerEmail})
        Status Changed: ${orderData.oldStatus.toUpperCase()} → ${orderData.newStatus.toUpperCase()}
        Order Total: ₹${orderData.totalAmount.toLocaleString()}
        Items: ${orderData.itemsCount} item(s)
        ${orderData.trackingNumber ? `Tracking: ${orderData.trackingNumber}` : ''}

        Customer has been automatically notified of this status change.
      `
    };
  }

  // Send order status notification to customer
  async sendOrderStatusNotification(orderData: {
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    oldStatus?: string;
    newStatus: string;
    orderDate: string;
    totalAmount: number;
    trackingNumber?: string;
    items: Array<{
      product_name: string;
      quantity: number;
      price: number;
    }>;
  }): Promise<boolean> {
    const template = this.getOrderStatusTemplate(orderData);
    
    return await this.sendEmail({
      to: orderData.customerEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  // Send admin notification for order status change
  async sendAdminOrderNotification(orderData: {
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    oldStatus: string;
    newStatus: string;
    totalAmount: number;
    itemsCount: number;
    trackingNumber?: string;
  }): Promise<boolean> {
    const adminEmail = envConfig.SMTP.user || 'admin@trueastrotalk.com';
    const template = this.getAdminOrderNotificationTemplate(orderData);
    
    return await this.sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
  }

  // Send bulk status update notification to admin
  async sendBulkOrderUpdateNotification(updatedCount: number, newStatus: string): Promise<boolean> {
    const adminEmail = envConfig.SMTP.user || 'admin@trueastrotalk.com';

    return await this.sendEmail({
      to: adminEmail,
      subject: `Bulk Update: ${updatedCount} orders updated to ${newStatus.toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Bulk Order Status Update Completed</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              ${this.getEmailHeader('Bulk Order Update Completed', 'Admin Notification')}

              <div style="padding: 30px;">
                <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                  <p style="margin: 0; color: #155724; font-size: 18px;">
                    <strong>✅ Successfully updated ${updatedCount} orders to "${newStatus.toUpperCase()}" status.</strong>
                  </p>
                </div>

                <p style="text-align: center; color: #666;">All affected customers have been automatically notified of their order status changes.</p>

                <p style="color: #999; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
                  Timestamp: ${new Date().toLocaleString('en-IN')}
                </p>
              </div>

              ${this.getEmailFooter()}
            </div>
          </body>
        </html>
      `,
      text: `
        Bulk Order Update Completed

        Successfully updated ${updatedCount} orders to "${newStatus.toUpperCase()}" status.

        All affected customers have been automatically notified of their order status changes.

        Timestamp: ${new Date().toLocaleString('en-IN')}
      `
    });
  }
}

export const emailService = new EmailService();