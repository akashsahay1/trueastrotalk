import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../../lib/database';
import '../../../../../lib/security';
import { withSecurity, SecurityPresets } from '@/lib/api-security';

// POST - Bulk delete orders (admin only)
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_ids } = body;

    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid order IDs',
        message: 'Array of order IDs is required'
      }, { status: 400 });
    }

    const ordersCollection = await DatabaseService.getCollection('orders');

    // Convert string IDs to ObjectIds
    const objectIds = order_ids.map(id => new ObjectId(id));

    // Delete the orders
    const result = await ordersCollection.deleteMany({
      _id: { $in: objectIds }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} orders`,
      deleted_count: result.deletedCount
    });

  } catch(error) {
    console.error('Bulk delete orders error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while deleting orders'
    }, { status: 500 });
  }
}

// Export secured handlers with admin-only access
export const POST = withSecurity(handlePOST, SecurityPresets.admin);