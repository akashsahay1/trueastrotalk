import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../../lib/database';
import { emailService } from '../../../../../lib/email-service';
import '../../../../../lib/security';

// POST - Bulk update order status (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_ids, status } = body;

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid order IDs',
        message: 'Array of order IDs is required'
      }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({
        success: false,
        error: 'Missing status',
        message: 'Status is required'
      }, { status: 400 });
    }

    const ordersCollection = await DatabaseService.getCollection('orders');

    // Convert string IDs to ObjectIds
    const objectIds = order_ids.map(id => new ObjectId(id));

    // Build update data
    const updateData: Record<string, unknown> = {
      status: status,
      updated_at: new Date()
    };

    // Set timestamps based on status
    if (status === 'shipped') {
      updateData.shipped_at = new Date();
    }
    if (status === 'delivered') {
      updateData.delivered_at = new Date();
    }

    // Get orders before updating to send notifications
    const ordersToUpdate = await ordersCollection.find({ 
      _id: { $in: objectIds } 
    }).toArray();

    // Update the orders
    const result = await ordersCollection.updateMany(
      { _id: { $in: objectIds } },
      { $set: updateData }
    );

    // Send email notifications for status changes
    if (result.modifiedCount > 0) {
      const usersCollection = await DatabaseService.getCollection('users');
      
      // Send individual customer notifications
      const emailPromises = ordersToUpdate.map(async (order) => {
        try {
          // Get user information
          const user = await usersCollection.findOne({ _id: new ObjectId(order.user_id) });
          
          if (user && user.email) {
            return await emailService.sendOrderStatusNotification({
              customerName: user.name || user.full_name || 'Valued Customer',
              customerEmail: user.email,
              orderNumber: order.order_number,
              oldStatus: order.status,
              newStatus: status,
              orderDate: new Date(order.created_at).toLocaleDateString('en-IN'),
              totalAmount: order.total_amount,
              trackingNumber: order.tracking_number,
              items: order.items || []
            });
          }
        } catch (error) {
          console.error(`Failed to send notification for order ${order.order_number}:`, error);
        }
        return false;
      });

      // Wait for all notifications to be sent
      await Promise.all(emailPromises);

      // Send bulk update notification to admin
      try {
        await emailService.sendBulkOrderUpdateNotification(result.modifiedCount, status);
      } catch (error) {
        console.error('Failed to send bulk update notification to admin:', error);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${result.modifiedCount} orders to ${status}`,
      updated_count: result.modifiedCount
    });

  } catch(error) {
    console.error('Bulk update orders error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while updating orders'
    }, { status: 500 });
  }
}