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
          email: envConfig.SEND_FROM || 'noreply@trueastrotalk.com',
          name: 'True Astrotalk'
        },
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
      };

      const _result = await sgMail.send(msg);
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
                <a href="${envConfig.NEXTAUTH_URL}/accounts/astrologers" class="btn">Review Application</a>
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
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .reset-box { background: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .btn { display: inline-block; padding: 15px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
            .security-note { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .token-info { background: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
              <p>Reset your True Astrotalk password</p>
            </div>
            <div class="content">
              <div class="reset-box">
                <h2>Hello ${user.name},</h2>
                <p>We received a request to reset your password for your True Astrotalk account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="${resetUrl}" class="btn">Reset Password</a>
              </div>

              <div class="security-note">
                <h4>🔒 Security Information</h4>
                <ul style="text-align: left; margin: 0; padding-left: 20px;">
                  <li>This link will expire in 15 minutes for security purposes</li>
                  <li>If you didn't request this reset, you can safely ignore this email</li>
                  <li>Your password won't be changed unless you click the link above</li>
                </ul>
              </div>

              <div class="token-info">
                <p><strong>Reset Token:</strong> ${resetToken}</p>
                <p style="font-size: 12px; color: #666;">You can also use this token in the mobile app if needed</p>
              </div>

              <div class="footer">
                <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
                <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                <p>This is an automated email from True Astrotalk. Please do not reply.</p>
              </div>
            </div>
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
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2c3e50;">True Astrotalk</h1>
                <div style="width: 100%; height: 3px; background: linear-gradient(to right, #ff6b6b, #4ecdc4); margin: 10px 0;"></div>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #2c3e50; margin-top: 0;">Order Status Update</h2>
                <p>Dear ${orderData.customerName},</p>
                <p>Your order status has been updated:</p>
                
                <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid ${statusColors[orderData.newStatus as keyof typeof statusColors]};">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong>Order #${orderData.orderNumber}</strong>
                    <span style="background: ${statusColors[orderData.newStatus as keyof typeof statusColors]}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; text-transform: uppercase;">
                      ${orderData.newStatus}
                    </span>
                  </div>
                  <p style="margin: 0; color: #666;">
                    ${statusMessages[orderData.newStatus as keyof typeof statusMessages]}
                  </p>
                  ${orderData.trackingNumber ? `<p style="margin: 5px 0 0 0;"><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>` : ''}
                </div>
              </div>

              <div style="background: white; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #2c3e50;">Order Details</h3>
                <p><strong>Order Date:</strong> ${orderData.orderDate}</p>
                <p><strong>Total Amount:</strong> ₹${orderData.totalAmount.toLocaleString()}</p>
                
                <h4 style="color: #2c3e50; border-bottom: 1px solid #e9ecef; padding-bottom: 5px;">Items Ordered</h4>
                <ul style="list-style: none; padding: 0;">
                  ${orderData.items.map(item => `
                    <li style="padding: 10px 0; border-bottom: 1px solid #f1f3f4;">
                      <div style="display: flex; justify-content: space-between;">
                        <span>${item.product_name} (x${item.quantity})</span>
                        <span>₹${(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    </li>
                  `).join('')}
                </ul>
              </div>

              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                <p style="color: #666; font-size: 14px;">
                  Thank you for shopping with True Astrotalk!<br>
                  If you have any questions, please contact our support team.
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 20px;">
                  This is an automated email. Please do not reply to this message.
                </p>
              </div>
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
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50;">Order Status Changed</h2>
              
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                <p><strong>Customer:</strong> ${orderData.customerName} (${orderData.customerEmail})</p>
                <p><strong>Status Changed:</strong> ${orderData.oldStatus.toUpperCase()} → ${orderData.newStatus.toUpperCase()}</p>
                <p><strong>Order Total:</strong> ₹${orderData.totalAmount.toLocaleString()}</p>
                <p><strong>Items:</strong> ${orderData.itemsCount} item(s)</p>
                ${orderData.trackingNumber ? `<p><strong>Tracking:</strong> ${orderData.trackingNumber}</p>` : ''}
              </div>

              <p style="color: #666; font-size: 14px;">
                Customer has been automatically notified of this status change.
              </p>
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
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2c3e50;">Bulk Order Update Completed</h2>
              
              <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <p style="margin: 0; color: #155724;">
                  <strong>✅ Successfully updated ${updatedCount} orders to "${newStatus.toUpperCase()}" status.</strong>
                </p>
              </div>

              <p>All affected customers have been automatically notified of their order status changes.</p>
              
              <p style="color: #666; font-size: 14px;">
                Timestamp: ${new Date().toLocaleString('en-IN')}
              </p>
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