import NotificationService, { NotificationType } from './notifications';
import DatabaseService from './database';
import { ObjectId } from 'mongodb';

/**
 * Notification triggers for various app events
 * This file contains all the automated notification logic
 */

export class NotificationTriggers {
  
  /**
   * Send payment success notification
   */
  static async onPaymentSuccess(userId: string, amount: number, transactionId: string): Promise<void> {
    try {
      await NotificationService.sendPaymentSuccessNotification(userId, amount, transactionId);
      console.log(`✅ Payment success notification sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending payment success notification:', error);
    }
  }

  /**
   * Send order placed notification
   */
  static async onOrderPlaced(userId: string, orderNumber: string, totalAmount: number, orderId: string): Promise<void> {
    try {
      const usersCollection = await DatabaseService.getCollection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      
      if (user) {
        await NotificationService.sendToUser(
          {
            userId,
            userType: user.user_type,
            fcmToken: user.fcm_token,
            email: user.email_address
          },
          {
            type: NotificationType.ORDER_PLACED,
            title: 'Order Confirmed! 📦',
            body: `Your order ${orderNumber} for ₹${totalAmount} has been placed successfully.`,
            data: { 
              orderNumber, 
              totalAmount,
              orderId,
              estimatedDelivery: '3-5 business days'
            }
          }
        );
      }
      
      console.log(`✅ Order placed notification sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending order placed notification:', error);
    }
  }

  /**
   * Send order shipped notification
   */
  static async onOrderShipped(userId: string, orderNumber: string, trackingNumber: string): Promise<void> {
    try {
      const usersCollection = await DatabaseService.getCollection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      
      if (user) {
        await NotificationService.sendToUser(
          {
            userId,
            userType: user.user_type,
            fcmToken: user.fcm_token,
            email: user.email_address
          },
          {
            type: NotificationType.ORDER_SHIPPED,
            title: 'Order Shipped! 🚚',
            body: `Your order ${orderNumber} has been shipped and is on its way!`,
            data: { 
              orderNumber, 
              trackingNumber,
              trackingUrl: `https://tracking.example.com/${trackingNumber}`
            }
          }
        );
      }
      
      console.log(`✅ Order shipped notification sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending order shipped notification:', error);
    }
  }

  /**
   * Send astrologer approval notification
   */
  static async onAstrologerApproved(astrologerId: string): Promise<void> {
    try {
      const usersCollection = await DatabaseService.getCollection('users');
      const astrologer = await usersCollection.findOne({ _id: new ObjectId(astrologerId) });
      
      if (astrologer) {
        await NotificationService.sendToUser(
          {
            userId: astrologerId,
            userType: astrologer.user_type,
            fcmToken: astrologer.fcm_token,
            email: astrologer.email_address
          },
          {
            type: NotificationType.ASTROLOGER_APPROVED,
            title: 'Welcome to TrueAstroTalk! 🎉',
            body: 'Congratulations! Your astrologer application has been approved. You can now start offering consultations.',
            data: { 
              astrologerId,
              nextSteps: ['Complete profile setup', 'Set consultation rates', 'Go online']
            }
          }
        );
      }
      
      console.log(`✅ Astrologer approval notification sent to ${astrologerId}`);
    } catch (error) {
      console.error('Error sending astrologer approval notification:', error);
    }
  }

  /**
   * Send astrologer rejection notification
   */
  static async onAstrologerRejected(astrologerId: string, reason: string): Promise<void> {
    try {
      const usersCollection = await DatabaseService.getCollection('users');
      const astrologer = await usersCollection.findOne({ _id: new ObjectId(astrologerId) });
      
      if (astrologer) {
        await NotificationService.sendToUser(
          {
            userId: astrologerId,
            userType: astrologer.user_type,
            fcmToken: astrologer.fcm_token,
            email: astrologer.email_address
          },
          {
            type: NotificationType.ASTROLOGER_REJECTED,
            title: 'Application Update',
            body: 'Your astrologer application needs review. Please check your email for details.',
            data: { 
              astrologerId,
              reason: reason || 'Please review your application details'
            }
          }
        );
      }
      
      console.log(`✅ Astrologer rejection notification sent to ${astrologerId}`);
    } catch (error) {
      console.error('Error sending astrologer rejection notification:', error);
    }
  }

  /**
   * Send chat session started notification
   */
  static async onChatSessionStarted(sessionId: string, customerId: string, astrologerId: string): Promise<void> {
    try {
      const usersCollection = await DatabaseService.getCollection('users');
      const [customer, astrologer] = await Promise.all([
        usersCollection.findOne({ _id: new ObjectId(customerId) }),
        usersCollection.findOne({ _id: new ObjectId(astrologerId) })
      ]);

      // Notify astrologer about new chat session
      if (astrologer) {
        await NotificationService.sendToUser(
          {
            userId: astrologerId,
            userType: astrologer.user_type,
            fcmToken: astrologer.fcm_token,
            email: astrologer.email_address
          },
          {
            type: NotificationType.SESSION_STARTED,
            title: 'New Chat Session! 💬',
            body: `${customer?.full_name || 'A customer'} has started a chat session with you.`,
            data: { 
              sessionId,
              customerId,
              customerName: customer?.full_name
            }
          }
        );
      }
      
      console.log(`✅ Chat session started notification sent to astrologer ${astrologerId}`);
    } catch (error) {
      console.error('Error sending chat session started notification:', error);
    }
  }

  /**
   * Send incoming call notification
   */
  static async onIncomingCall(callerId: string, receiverId: string, callType: string): Promise<void> {
    try {
      const usersCollection = await DatabaseService.getCollection('users');
      const [caller, receiver] = await Promise.all([
        usersCollection.findOne({ _id: new ObjectId(callerId) }),
        usersCollection.findOne({ _id: new ObjectId(receiverId) })
      ]);

      if (receiver && caller) {
        await NotificationService.sendToUser(
          {
            userId: receiverId,
            userType: receiver.user_type,
            fcmToken: receiver.fcm_token,
            email: receiver.email_address
          },
          {
            type: NotificationType.CALL_REQUEST,
            title: `Incoming ${callType} call 📞`,
            body: `${caller.full_name} is calling you`,
            data: { 
              callerId,
              callerName: caller.full_name,
              callType
            }
          }
        );
      }
      
      console.log(`✅ Incoming call notification sent to ${receiverId}`);
    } catch (error) {
      console.error('Error sending incoming call notification:', error);
    }
  }

  /**
   * Send wallet recharged notification
   */
  static async onWalletRecharged(userId: string, amount: number, newBalance: number): Promise<void> {
    try {
      const usersCollection = await DatabaseService.getCollection('users');
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      
      if (user) {
        await NotificationService.sendToUser(
          {
            userId,
            userType: user.user_type,
            fcmToken: user.fcm_token,
            email: user.email_address
          },
          {
            type: NotificationType.WALLET_RECHARGED,
            title: 'Wallet Recharged! 💰',
            body: `₹${amount} has been added to your wallet. New balance: ₹${newBalance}`,
            data: { 
              amount,
              newBalance,
              rechargedAt: new Date().toISOString()
            }
          }
        );
      }
      
      console.log(`✅ Wallet recharged notification sent to user ${userId}`);
    } catch (error) {
      console.error('Error sending wallet recharged notification:', error);
    }
  }

  /**
   * Send withdrawal processed notification
   */
  static async onWithdrawalProcessed(astrologerId: string, amount: number, status: string): Promise<void> {
    try {
      const usersCollection = await DatabaseService.getCollection('users');
      const astrologer = await usersCollection.findOne({ _id: new ObjectId(astrologerId) });
      
      if (astrologer) {
        const title = status === 'approved' ? 'Withdrawal Approved! ✅' : 'Withdrawal Update';
        const body = status === 'approved' 
          ? `Your withdrawal request of ₹${amount} has been approved and processed.`
          : `Your withdrawal request of ₹${amount} has been ${status}.`;

        await NotificationService.sendToUser(
          {
            userId: astrologerId,
            userType: astrologer.user_type,
            fcmToken: astrologer.fcm_token,
            email: astrologer.email_address
          },
          {
            type: NotificationType.WITHDRAWAL_PROCESSED,
            title,
            body,
            data: { 
              amount,
              status,
              processedAt: new Date().toISOString()
            }
          }
        );
      }
      
      console.log(`✅ Withdrawal processed notification sent to astrologer ${astrologerId}`);
    } catch (error) {
      console.error('Error sending withdrawal processed notification:', error);
    }
  }

  /**
   * Send promotional notification to targeted users
   */
  static async sendPromotionalNotification(
    targetUserType: 'customer' | 'astrologer' | 'all',
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<number> {
    try {
      const usersCollection = await DatabaseService.getCollection('users');
      
      const query: Record<string, unknown> = { 
        account_status: 'active',
        notification_preferences: { $ne: false } // Users who haven't disabled notifications
      };

      if (targetUserType !== 'all') {
        query.user_type = targetUserType;
      }

      // Also check if promotional notifications are enabled
      query['notification_preferences.promotional_notifications'] = { $ne: false };

      const users = await usersCollection
        .find(query)
        .toArray();

      const targets = users.map(user => ({
        userId: user._id.toString(),
        userType: user.user_type,
        fcmToken: user.fcm_token,
        email: user.email_address
      }));

      const successCount = await NotificationService.sendBulkNotifications(targets, {
        type: NotificationType.PROMOTIONAL,
        title,
        body,
        data: data || {}
      });

      console.log(`✅ Promotional notification sent to ${successCount}/${targets.length} users`);
      return successCount;
    } catch (error) {
      console.error('Error sending promotional notification:', error);
      return 0;
    }
  }

  /**
   * Send system maintenance notification
   */
  static async sendMaintenanceNotification(
    title: string,
    body: string,
    scheduledTime?: Date
  ): Promise<number> {
    try {
      const usersCollection = await DatabaseService.getCollection('users');
      
      const users = await usersCollection
        .find({ 
          account_status: 'active',
          'notification_preferences.system_notifications': { $ne: false }
        })
        .toArray();

      const targets = users.map(user => ({
        userId: user._id.toString(),
        userType: user.user_type,
        fcmToken: user.fcm_token,
        email: user.email_address
      }));

      const successCount = await NotificationService.sendBulkNotifications(targets, {
        type: NotificationType.SYSTEM_MAINTENANCE,
        title,
        body,
        data: {
          scheduledTime: scheduledTime?.toISOString(),
          isSystemNotification: true
        },
        scheduleAt: scheduledTime
      });

      console.log(`✅ System maintenance notification sent to ${successCount}/${targets.length} users`);
      return successCount;
    } catch (error) {
      console.error('Error sending system maintenance notification:', error);
      return 0;
    }
  }
}

export default NotificationTriggers;