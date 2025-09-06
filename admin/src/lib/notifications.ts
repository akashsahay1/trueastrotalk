import admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';
import DatabaseService from './database';
import { ObjectId } from 'mongodb';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

try {
  // Only initialize Firebase if all required environment variables are present
  const requiredFirebaseEnvs = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID', 
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID'
  ];

  const hasAllFirebaseEnvs = requiredFirebaseEnvs.every(envVar => process.env[envVar]);

  if (hasAllFirebaseEnvs && !admin.apps.length) {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID!,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID!,
      private_key: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL!,
      client_id: process.env.FIREBASE_CLIENT_ID!,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  } else if (admin.apps.length) {
    firebaseApp = admin.app();
  } else {
    console.warn('Firebase Admin not initialized: Missing required environment variables');
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  firebaseApp = null;
}

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Notification types
export enum NotificationType {
  CHAT_MESSAGE = 'chat_message',
  CALL_REQUEST = 'call_request',
  CALL_ACCEPTED = 'call_accepted',
  CALL_REJECTED = 'call_rejected',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  ORDER_PLACED = 'order_placed',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  ASTROLOGER_APPROVED = 'astrologer_approved',
  ASTROLOGER_REJECTED = 'astrologer_rejected',
  WALLET_RECHARGED = 'wallet_recharged',
  WITHDRAWAL_PROCESSED = 'withdrawal_processed',
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  PROMOTIONAL = 'promotional'
}

// Notification channels
export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  IN_APP = 'in_app'
}

// Notification priority
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  imageUrl?: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  scheduleAt?: Date;
}

interface NotificationTarget {
  userId: string;
  userType: 'customer' | 'astrologer' | 'administrator';
  fcmToken?: string;
  email?: string;
  preferences?: NotificationPreferences;
}

interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  chat_notifications: boolean;
  call_notifications: boolean;
  payment_notifications: boolean;
  order_notifications: boolean;
  promotional_notifications: boolean;
  system_notifications: boolean;
}

interface EmailTemplate {
  templateId?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export class NotificationService {
  
  /**
   * Send notification to a single user
   */
  static async sendToUser(target: NotificationTarget, notification: NotificationData): Promise<boolean> {
    try {
      console.log(`📢 Sending ${notification.type} notification to user ${target.userId}`);

      // Store notification in database
      await this.storeNotification(target, notification);

      // Get user preferences
      const preferences = await this.getUserPreferences(target.userId);
      
      // Determine which channels to use
      const channels = notification.channels || [NotificationChannel.PUSH, NotificationChannel.EMAIL];
      
      const results = await Promise.allSettled([
        // Send push notification
        channels.includes(NotificationChannel.PUSH) && preferences.push_enabled 
          ? this.sendPushNotification(target, notification)
          : Promise.resolve(false),
        
        // Send email notification
        channels.includes(NotificationChannel.EMAIL) && preferences.email_enabled 
          ? this.sendEmailNotification(target, notification)
          : Promise.resolve(false)
      ]);

      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value === true
      ).length;

      console.log(`✅ Notification sent via ${successCount}/${channels.length} channels`);
      return successCount > 0;

    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Send push notification via Firebase FCM
   */
  static async sendPushNotification(target: NotificationTarget, notification: NotificationData): Promise<boolean> {
    try {
      if (!firebaseApp || !target.fcmToken) {
        console.log('❌ Firebase not initialized or no FCM token');
        return false;
      }

      // Check notification type preferences
      if (!this.isNotificationTypeEnabled(target.preferences, notification.type)) {
        console.log(`🔕 ${notification.type} notifications disabled for user ${target.userId}`);
        return false;
      }

      const message: admin.messaging.Message = {
        token: target.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl
        },
        data: {
          type: notification.type,
          userId: target.userId,
          ...notification.data
        },
        android: {
          priority: this.getAndroidMessagePriority(notification.priority),
          notification: {
            channelId: this.getNotificationChannelId(notification.type),
            priority: this.getAndroidNotificationPriority(notification.priority),
            defaultSound: true,
            defaultVibrateTimings: true
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body
              },
              badge: 1,
              sound: 'default',
              category: notification.type
            }
          }
        }
      };

      const response = await firebaseApp.messaging().send(message);
      console.log(`✅ Push notification sent successfully: ${response}`);
      
      // Update delivery status
      await this.updateNotificationStatus(target.userId, notification.type, 'delivered');
      
      return true;

    } catch (error) {
      console.error('Push notification error:', error);
      await this.updateNotificationStatus(target.userId, notification.type, 'failed');
      return false;
    }
  }

  /**
   * Send email notification via SendGrid
   */
  static async sendEmailNotification(target: NotificationTarget, notification: NotificationData): Promise<boolean> {
    try {
      if (!process.env.SENDGRID_API_KEY || !target.email) {
        console.log('❌ SendGrid not configured or no email address');
        return false;
      }

      // Check notification type preferences
      if (!this.isNotificationTypeEnabled(target.preferences, notification.type)) {
        console.log(`🔕 ${notification.type} email notifications disabled for user ${target.userId}`);
        return false;
      }

      const emailTemplate = this.getEmailTemplate(notification.type, notification.data);
      
      const msg = {
        to: target.email,
        from: {
          email: process.env.FROM_EMAIL || 'noreply@trueastrotalk.com',
          name: 'True Astrotalk'
        },
        subject: emailTemplate.subject,
        html: emailTemplate.htmlContent,
        text: emailTemplate.textContent || notification.body,
        trackingSettings: {
          clickTracking: {
            enable: true
          },
          openTracking: {
            enable: true
          }
        },
        customArgs: {
          user_id: target.userId,
          notification_type: notification.type
        }
      };

      await sgMail.send(msg);
      console.log(`✅ Email notification sent to ${target.email}`);
      
      // Update delivery status
      await this.updateNotificationStatus(target.userId, notification.type, 'delivered');
      
      return true;

    } catch (error) {
      console.error('Email notification error:', error);
      await this.updateNotificationStatus(target.userId, notification.type, 'failed');
      return false;
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  static async sendBulkNotifications(targets: NotificationTarget[], notification: NotificationData): Promise<number> {
    try {
      console.log(`📢 Sending bulk ${notification.type} notification to ${targets.length} users`);

      const results = await Promise.allSettled(
        targets.map(target => this.sendToUser(target, notification))
      );

      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value === true
      ).length;

      console.log(`✅ Bulk notification sent successfully to ${successCount}/${targets.length} users`);
      return successCount;

    } catch (error) {
      console.error('Bulk notification error:', error);
      return 0;
    }
  }

  /**
   * Store notification in database
   */
  static async storeNotification(target: NotificationTarget, notification: NotificationData): Promise<void> {
    try {
      const notificationsCollection = await DatabaseService.getCollection('notifications');
      
      const notificationDoc = {
        _id: new ObjectId(),
        user_id: new ObjectId(target.userId),
        user_type: target.userType,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        image_url: notification.imageUrl,
        action_url: notification.actionUrl,
        priority: notification.priority || NotificationPriority.NORMAL,
        channels: notification.channels || [NotificationChannel.PUSH, NotificationChannel.EMAIL],
        is_read: false,
        delivery_status: 'pending',
        scheduled_at: notification.scheduleAt,
        created_at: new Date(),
        updated_at: new Date()
      };

      await notificationsCollection.insertOne(notificationDoc);

    } catch (error) {
      console.error('Error storing notification:', error);
    }
  }

  /**
   * Get user notification preferences
   */
  static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const usersCollection = await DatabaseService.getCollection('users');
      const user = await usersCollection.findOne(
        { _id: new ObjectId(userId) },
        { projection: { notification_preferences: 1 } }
      );

      return user?.notification_preferences || {
        push_enabled: true,
        email_enabled: true,
        chat_notifications: true,
        call_notifications: true,
        payment_notifications: true,
        order_notifications: true,
        promotional_notifications: true,
        system_notifications: true
      };

    } catch (error) {
      console.error('Error getting user preferences:', error);
      return {
        push_enabled: true,
        email_enabled: true,
        chat_notifications: true,
        call_notifications: true,
        payment_notifications: true,
        order_notifications: true,
        promotional_notifications: true,
        system_notifications: true
      };
    }
  }

  /**
   * Update notification delivery status
   */
  static async updateNotificationStatus(userId: string, type: NotificationType, status: string): Promise<void> {
    try {
      const notificationsCollection = await DatabaseService.getCollection('notifications');
      await notificationsCollection.updateMany(
        {
          user_id: new ObjectId(userId),
          type: type,
          delivery_status: 'pending'
        },
        {
          $set: {
            delivery_status: status,
            updated_at: new Date()
          }
        }
      );
    } catch (error) {
      console.error('Error updating notification status:', error);
    }
  }

  /**
   * Check if notification type is enabled for user
   */
  static isNotificationTypeEnabled(preferences: NotificationPreferences | undefined, type: NotificationType): boolean {
    if (!preferences) return true;

    switch (type) {
      case NotificationType.CHAT_MESSAGE:
      case NotificationType.SESSION_STARTED:
      case NotificationType.SESSION_ENDED:
        return preferences.chat_notifications;
      
      case NotificationType.CALL_REQUEST:
      case NotificationType.CALL_ACCEPTED:
      case NotificationType.CALL_REJECTED:
        return preferences.call_notifications;
      
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.PAYMENT_FAILED:
      case NotificationType.WALLET_RECHARGED:
      case NotificationType.WITHDRAWAL_PROCESSED:
        return preferences.payment_notifications;
      
      case NotificationType.ORDER_PLACED:
      case NotificationType.ORDER_SHIPPED:
      case NotificationType.ORDER_DELIVERED:
        return preferences.order_notifications;
      
      case NotificationType.PROMOTIONAL:
        return preferences.promotional_notifications;
      
      case NotificationType.SYSTEM_MAINTENANCE:
      case NotificationType.ASTROLOGER_APPROVED:
      case NotificationType.ASTROLOGER_REJECTED:
        return preferences.system_notifications;
      
      default:
        return true;
    }
  }

  /**
   * Get Android FCM priority for message
   */
  static getAndroidMessagePriority(priority?: NotificationPriority): 'high' | 'normal' {
    return priority === NotificationPriority.HIGH || priority === NotificationPriority.URGENT ? 'high' : 'normal';
  }

  /**
   * Get Android notification priority
   */
  static getAndroidNotificationPriority(priority?: NotificationPriority): 'default' | 'min' | 'max' | 'high' | 'low' {
    switch (priority) {
      case NotificationPriority.URGENT:
        return 'max';
      case NotificationPriority.HIGH:
        return 'high';
      case NotificationPriority.NORMAL:
        return 'default';
      case NotificationPriority.LOW:
        return 'low';
      default:
        return 'default';
    }
  }

  /**
   * Get notification channel ID for Android
   */
  static getNotificationChannelId(type: NotificationType): string {
    switch (type) {
      case NotificationType.CHAT_MESSAGE:
      case NotificationType.SESSION_STARTED:
      case NotificationType.SESSION_ENDED:
        return 'chat_channel';
      
      case NotificationType.CALL_REQUEST:
      case NotificationType.CALL_ACCEPTED:
      case NotificationType.CALL_REJECTED:
        return 'calls_channel';
      
      case NotificationType.PAYMENT_SUCCESS:
      case NotificationType.PAYMENT_FAILED:
      case NotificationType.WALLET_RECHARGED:
      case NotificationType.WITHDRAWAL_PROCESSED:
        return 'payments_channel';
      
      case NotificationType.ORDER_PLACED:
      case NotificationType.ORDER_SHIPPED:
      case NotificationType.ORDER_DELIVERED:
        return 'orders_channel';
      
      case NotificationType.PROMOTIONAL:
        return 'promotional_channel';
      
      default:
        return 'default_channel';
    }
  }

  /**
   * Get email template for notification type
   */
  static getEmailTemplate(type: NotificationType, data?: Record<string, unknown>): EmailTemplate {
    const baseUrl = process.env.FRONTEND_URL || 'https://trueastrotalk.com';
    
    switch (type) {
      case NotificationType.PAYMENT_SUCCESS:
        return {
          subject: 'Payment Successful - True Astrotalk',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4CAF50;">Payment Successful! 💰</h2>
              <p>Your payment of ₹${data?.amount} has been processed successfully.</p>
              <p><strong>Transaction ID:</strong> ${data?.transactionId}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
                <p style="margin: 0;">Your wallet has been credited and you can now enjoy our services!</p>
              </div>
              <a href="${baseUrl}/wallet" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Wallet</a>
            </div>
          `
        };

      case NotificationType.ORDER_PLACED:
        return {
          subject: 'Order Confirmation - True Astrotalk',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2196F3;">Order Confirmed! 📦</h2>
              <p>Thank you for your order. Here are the details:</p>
              <p><strong>Order Number:</strong> ${data?.orderNumber}</p>
              <p><strong>Total Amount:</strong> ₹${data?.totalAmount}</p>
              <p><strong>Estimated Delivery:</strong> ${data?.estimatedDelivery || '3-5 business days'}</p>
              <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
                <p style="margin: 0;">We'll send you updates as your order is processed and shipped.</p>
              </div>
            </div>
          `
        };

      case NotificationType.ASTROLOGER_APPROVED:
        return {
          subject: 'Welcome to True Astrotalk - Application Approved! 🎉',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4CAF50;">Congratulations! You're now a True Astrotalk Astrologer! 🌟</h2>
              <p>Your application has been approved and you can now start offering consultations.</p>
              <div style="margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
                <h3>Next Steps:</h3>
                <ul>
                  <li>Complete your profile setup</li>
                  <li>Set your consultation rates</li>
                  <li>Go online to start receiving requests</li>
                </ul>
              </div>
              <a href="${baseUrl}/astrologer/dashboard" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
            </div>
          `
        };

      default:
        return {
          subject: 'Notification from True Astrotalk',
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">True Astrotalk</h2>
              <p>${data?.message || 'You have a new notification from True Astrotalk.'}</p>
              <a href="${baseUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Open App</a>
            </div>
          `
        };
    }
  }

  /**
   * Send notification for specific events
   */
  static async sendChatMessageNotification(senderId: string, receiverId: string, message: string): Promise<void> {
    const usersCollection = await DatabaseService.getCollection('users');
    const receiver = await usersCollection.findOne({ _id: new ObjectId(receiverId) });
    const sender = await usersCollection.findOne({ _id: new ObjectId(senderId) });
    
    if (receiver && sender) {
      await this.sendToUser(
        {
          userId: receiverId,
          userType: receiver.user_type,
          fcmToken: receiver.fcm_token,
          email: receiver.email_address
        },
        {
          type: NotificationType.CHAT_MESSAGE,
          title: `New message from ${sender.full_name}`,
          body: message.length > 50 ? message.substring(0, 50) + '...' : message,
          data: { senderId, senderName: sender.full_name },
          priority: NotificationPriority.HIGH,
          channels: [NotificationChannel.PUSH]
        }
      );
    }
  }

  static async sendPaymentSuccessNotification(userId: string, amount: number, transactionId: string): Promise<void> {
    const usersCollection = await DatabaseService.getCollection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    
    if (user) {
      await this.sendToUser(
        {
          userId,
          userType: user.user_type,
          fcmToken: user.fcm_token,
          email: user.email_address
        },
        {
          type: NotificationType.PAYMENT_SUCCESS,
          title: 'Payment Successful!',
          body: `Your payment of ₹${amount} has been processed successfully.`,
          data: { amount, transactionId },
          priority: NotificationPriority.HIGH
        }
      );
    }
  }

  static async sendOrderPlacedNotification(userId: string, orderNumber: string, totalAmount: number): Promise<void> {
    const usersCollection = await DatabaseService.getCollection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    
    if (user) {
      await this.sendToUser(
        {
          userId,
          userType: user.user_type,
          fcmToken: user.fcm_token,
          email: user.email_address
        },
        {
          type: NotificationType.ORDER_PLACED,
          title: 'Order Confirmed!',
          body: `Your order ${orderNumber} for ₹${totalAmount} has been placed successfully.`,
          data: { orderNumber, totalAmount },
          priority: NotificationPriority.NORMAL
        }
      );
    }
  }
}

export default NotificationService;