import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import DatabaseService from '../../../../../lib/database';
import '../../../../../lib/security';
import { withSecurity, SecurityPresets } from '@/lib/api-security';

// GET - Export orders to CSV/Excel (admin only)
async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('payment_status');
    const orderType = searchParams.get('type') || 'complete';
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const amountMin = searchParams.get('amount_min');
    const amountMax = searchParams.get('amount_max');
    const customerFilter = searchParams.get('customer');
    const format = searchParams.get('format') || 'csv'; // csv or excel

    const ordersCollection = await DatabaseService.getCollection('orders');
    const usersCollection = await DatabaseService.getCollection('users');

    // Build query (same logic as main orders API)
    const query: Record<string, unknown> = {};
    
    // Order type filtering with date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    switch (orderType) {
      case 'complete':
        query.payment_status = 'paid';
        if (!fromDate && !toDate) {
          query.created_at = { $gte: thirtyDaysAgo };
        }
        break;
      
      case 'pending':
        query.$or = [
          { payment_status: 'pending' },
          { payment_status: 'failed' }
        ];
        break;
      
      case 'history':
        if (!fromDate && !toDate) {
          query.created_at = { $lt: thirtyDaysAgo };
        }
        break;
    }

    // Date range filtering
    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};
      
      if (fromDate) {
        dateFilter.$gte = new Date(fromDate);
      }
      
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        dateFilter.$lte = endDate;
      }
      
      if (Object.keys(dateFilter).length > 0) {
        query.created_at = dateFilter;
      }
    }
    
    // Search functionality
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$and = [
        ...(Array.isArray(query.$and) ? query.$and : []),
        {
          $or: [
            { order_number: searchRegex },
            { 'shipping_address.full_name': searchRegex },
            { 'shipping_address.phone_number': searchRegex },
            { 'items.product_name': searchRegex }
          ]
        }
      ];
    }

    // Status filters
    if (status && status !== 'all') {
      query.status = status;
    }

    if (paymentStatus && paymentStatus !== 'all' && orderType !== 'complete') {
      query.payment_status = paymentStatus;
    }

    // Amount range filtering
    if (amountMin || amountMax) {
      const amountFilter: Record<string, number> = {};
      
      if (amountMin) {
        amountFilter.$gte = parseFloat(amountMin);
      }
      
      if (amountMax) {
        amountFilter.$lte = parseFloat(amountMax);
      }
      
      if (Object.keys(amountFilter).length > 0) {
        query.total_amount = amountFilter;
      }
    }

    // Get all orders (no pagination for export)
    const orders = await ordersCollection
      .find(query)
      .sort({ created_at: -1 })
      .toArray();

    // Format data for export
    const exportData = [];
    
    for (const order of orders) {
      // Get user information
      let userInfo = null;
      if (order.user_id) {
        try {
          const user = await usersCollection.findOne({ _id: new ObjectId(order.user_id) });
          if (user) {
            userInfo = {
              name: user.name || user.full_name || 'Unknown User',
              email: user.email || '',
              phone: user.phone || user.phone_number || ''
            };
          }
        } catch (error) {
          console.error(`Failed to fetch user info for user_id ${order.user_id}:`, error);
        }
      }

      // Filter by customer if specified
      if (customerFilter && userInfo) {
        const customerRegex = new RegExp(customerFilter, 'i');
        if (!customerRegex.test(userInfo.name) && !customerRegex.test(userInfo.email)) {
          continue; // Skip this order
        }
      }

      // Format order data for export
      exportData.push({
        'Order Number': order.order_number,
        'Customer Name': userInfo?.name || 'Unknown User',
        'Customer Email': userInfo?.email || '',
        'Customer Phone': userInfo?.phone || '',
        'Order Date': new Date(order.created_at).toLocaleDateString('en-IN'),
        'Order Time': new Date(order.created_at).toLocaleTimeString('en-IN'),
        'Status': order.status?.toUpperCase() || 'UNKNOWN',
        'Payment Status': order.payment_status?.toUpperCase() || 'UNKNOWN',
        'Payment Method': order.payment_method || '',
        'Items Count': order.items?.length || 0,
        'Subtotal': order.subtotal || 0,
        'Shipping Cost': order.shipping_cost || 0,
        'Tax Amount': order.tax_amount || 0,
        'Total Amount': order.total_amount || 0,
        'Shipping Address': `${order.shipping_address?.full_name || ''}, ${order.shipping_address?.address_line_1 || ''}, ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} - ${order.shipping_address?.postal_code || ''}`,
        'Phone Number': order.shipping_address?.phone_number || '',
        'Tracking Number': order.tracking_number || '',
        'Notes': order.notes || '',
        'Shipped Date': order.shipped_at ? new Date(order.shipped_at).toLocaleDateString('en-IN') : '',
        'Delivered Date': order.delivered_at ? new Date(order.delivered_at).toLocaleDateString('en-IN') : ''
      });
    }

    if (exportData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No orders found',
        message: 'No orders match the specified criteria'
      }, { status: 404 });
    }

    // Generate CSV
    if (format === 'csv') {
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escape quotes and wrap in quotes if contains comma
            const stringValue = String(value || '');
            return stringValue.includes(',') || stringValue.includes('"') 
              ? `"${stringValue.replace(/"/g, '""')}"` 
              : stringValue;
          }).join(',')
        )
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="orders-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // For Excel format, return JSON data that frontend can process with a library
    // This is a simplified approach - in production you might want to use a server-side Excel library
    if (format === 'excel') {
      return NextResponse.json({
        success: true,
        data: exportData,
        format: 'excel',
        filename: `orders-export-${new Date().toISOString().split('T')[0]}.xlsx`
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Unsupported format',
      message: 'Only CSV and Excel formats are supported'
    }, { status: 400 });

  } catch(error) {
    console.error('Export orders error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred while exporting orders'
    }, { status: 500 });
  }
}

// Export secured handlers with admin-only access
export const GET = withSecurity(handleGET, SecurityPresets.admin);