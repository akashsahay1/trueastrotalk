import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../models/order.dart';
import '../models/address.dart';
import '../services/service_locator.dart';
import '../services/api/orders_api_service.dart';
import '../services/local/local_storage_service.dart';
import 'order_details.dart';
import 'products_list.dart';

class OrdersListScreen extends StatefulWidget {
  const OrdersListScreen({super.key});

  @override
  State<OrdersListScreen> createState() => _OrdersListScreenState();
}

class _OrdersListScreenState extends State<OrdersListScreen> with SingleTickerProviderStateMixin {
  late final OrdersApiService _ordersApiService;
  late final LocalStorageService _localStorage;
  late TabController _tabController;
  
  List<Order> _allOrders = [];
  bool _isLoading = true;

  final List<String> _tabs = ['All', 'Pending', 'Shipped', 'Delivered', 'Cancelled'];

  @override
  void initState() {
    super.initState();
    _ordersApiService = getIt<OrdersApiService>();
    _localStorage = getIt<LocalStorageService>();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _loadOrders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Get custom user ID from local storage (not MongoDB ObjectId)
      final userId = _localStorage.getUserId() ?? 'user123';
      debugPrint('🔍 Loading orders for user_id: $userId');
      
      // Fetch orders from API
      final result = await _ordersApiService.getOrders(
        userId: userId,
        userType: 'user',
      );
      
      if (result['success']) {
        _allOrders = result['orders'];
      } else {
        // Fallback to sample data if API fails
        _allOrders = _getSampleOrders();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['error'] ?? 'Failed to load orders')),
          );
        }
      }
    } catch (e) {
      debugPrint('Error loading orders: $e');
      _allOrders = _getSampleOrders();
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  List<Order> _getSampleOrders() {
    final sampleAddress = Address(
      id: '1',
      fullName: 'John Doe',
      phoneNumber: '+91 9876543210',
      addressLine1: '123, Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      isDefault: true,
      addressType: 'home',
    );

    return [
      Order(
        id: '1',
        orderNumber: 'ORD-2024-001',
        userId: 'user1',
        items: [
          OrderItem(
            productId: 'p1',
            productName: 'Rudraksha Mala',
            productPrice: 999,
            category: 'Spiritual Items',
            quantity: 1,
            totalPrice: 999,
          ),
          OrderItem(
            productId: 'p2',
            productName: 'Crystal Healing Set',
            productPrice: 1499,
            category: 'Spiritual Items',
            quantity: 1,
            totalPrice: 1499,
          ),
        ],
        subtotal: 2498,
        shippingCost: 0,
        taxAmount: 449.64,
        totalAmount: 2947.64,
        status: OrderStatus.delivered,
        paymentStatus: PaymentStatus.completed,
        paymentMethod: PaymentMethod.razorpay,
        paymentId: 'pay_1234567890',
        shippingAddress: sampleAddress,
        orderDate: DateTime.now().subtract(const Duration(days: 5)),
        expectedDeliveryDate: DateTime.now().subtract(const Duration(days: 1)),
        deliveredDate: DateTime.now().subtract(const Duration(days: 1)),
        createdAt: DateTime.now().subtract(const Duration(days: 5)),
      ),
      Order(
        id: '2',
        orderNumber: 'ORD-2024-002',
        userId: 'user1',
        items: [
          OrderItem(
            productId: 'p3',
            productName: 'Gemstone Ring',
            productPrice: 2999,
            category: 'Jewelry',
            quantity: 1,
            totalPrice: 2999,
          ),
        ],
        subtotal: 2999,
        shippingCost: 50,
        taxAmount: 539.82,
        totalAmount: 3588.82,
        status: OrderStatus.shipped,
        paymentStatus: PaymentStatus.completed,
        paymentMethod: PaymentMethod.razorpay,
        paymentId: 'pay_0987654321',
        shippingAddress: sampleAddress,
        orderDate: DateTime.now().subtract(const Duration(days: 2)),
        expectedDeliveryDate: DateTime.now().add(const Duration(days: 3)),
        trackingNumber: 'TRK123456789',
        createdAt: DateTime.now().subtract(const Duration(days: 2)),
      ),
      Order(
        id: '3',
        orderNumber: 'ORD-2024-003',
        userId: 'user1',
        items: [
          OrderItem(
            productId: 'p4',
            productName: 'Astrology Book Set',
            productPrice: 799,
            category: 'Books',
            quantity: 2,
            totalPrice: 1598,
          ),
        ],
        subtotal: 1598,
        shippingCost: 50,
        taxAmount: 287.64,
        totalAmount: 1935.64,
        status: OrderStatus.pending,
        paymentStatus: PaymentStatus.pending,
        paymentMethod: PaymentMethod.cod,
        shippingAddress: sampleAddress,
        orderDate: DateTime.now().subtract(const Duration(hours: 2)),
        expectedDeliveryDate: DateTime.now().add(const Duration(days: 7)),
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      ),
    ];
  }

  List<Order> _getFilteredOrders() {
    final selectedTab = _tabs[_tabController.index];
    
    switch (selectedTab) {
      case 'All':
        return _allOrders;
      case 'Pending':
        return _allOrders.where((order) => 
          order.status == OrderStatus.pending || 
          order.status == OrderStatus.confirmed ||
          order.status == OrderStatus.processing
        ).toList();
      case 'Shipped':
        return _allOrders.where((order) => 
          order.status == OrderStatus.shipped || 
          order.status == OrderStatus.outForDelivery
        ).toList();
      case 'Delivered':
        return _allOrders.where((order) => 
          order.status == OrderStatus.delivered
        ).toList();
      case 'Cancelled':
        return _allOrders.where((order) => 
          order.status == OrderStatus.cancelled || 
          order.status == OrderStatus.refunded
        ).toList();
      default:
        return _allOrders;
    }
  }

  void _navigateToOrderDetails(Order order) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => OrderDetailsScreen(order: order),
      ),
    );
  }

  Future<void> _cancelOrder(Order order) async {
    if (!order.canBeCancelled) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('This order cannot be cancelled'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Order'),
        content: Text('Are you sure you want to cancel order #${order.orderNumber}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Yes, Cancel', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (result == true) {
      // Call API to cancel order
      try {
        final userId = _localStorage.getUserId() ?? 'user123';
        final cancelResult = await _ordersApiService.cancelOrder(
          orderId: order.id ?? '',
          userId: userId,
          reason: 'Cancelled by customer',
        );
        
        if (cancelResult['success']) {
          // Update local state
          setState(() {
            final index = _allOrders.indexWhere((o) => o.id == order.id);
            if (index >= 0) {
              _allOrders[index] = Order(
                id: order.id,
                orderNumber: order.orderNumber,
                userId: order.userId,
                items: order.items,
                subtotal: order.subtotal,
                shippingCost: order.shippingCost,
                taxAmount: order.taxAmount,
                totalAmount: order.totalAmount,
                status: OrderStatus.cancelled,
                paymentStatus: order.paymentStatus,
                paymentMethod: order.paymentMethod,
                paymentId: order.paymentId,
                razorpayOrderId: order.razorpayOrderId,
                shippingAddress: order.shippingAddress,
                billingAddress: order.billingAddress,
                orderDate: order.orderDate,
                expectedDeliveryDate: order.expectedDeliveryDate,
                deliveredDate: order.deliveredDate,
                trackingNumber: order.trackingNumber,
                notes: order.notes,
                createdAt: order.createdAt,
                updatedAt: DateTime.now(),
              );
            }
          });

          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Order cancelled successfully'),
                backgroundColor: AppColors.success,
              ),
            );
          }
        } else {
          throw Exception(cancelResult['error'] ?? 'Failed to cancel order');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to cancel order: $e'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 243, 245, 249),
      appBar: AppBar(
        title: Text('My Orders', style: AppTextStyles.heading4.copyWith(color: AppColors.white)),
        backgroundColor: AppColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
          indicatorColor: AppColors.white,
          labelColor: AppColors.white,
          unselectedLabelColor: AppColors.white.withValues(alpha: 0.7),
          onTap: (_) => setState(() {}),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: _tabs.map((tab) => _buildOrdersList()).toList(),
            ),
    );
  }

  Widget _buildOrdersList() {
    final filteredOrders = _getFilteredOrders();
    
    if (filteredOrders.isEmpty) {
      return _buildEmptyState();
    }

    return RefreshIndicator(
      onRefresh: _loadOrders,
      color: AppColors.primary,
      child: ListView.separated(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        itemCount: filteredOrders.length,
        separatorBuilder: (context, index) => const SizedBox(height: Dimensions.spacingMd),
        itemBuilder: (context, index) => _buildOrderCard(filteredOrders[index]),
      ),
    );
  }

  Widget _buildEmptyState() {
    final selectedTab = _tabs[_tabController.index];
    
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.shopping_bag_outlined,
            size: 64,
            color: AppColors.grey400,
          ),
          const SizedBox(height: Dimensions.spacingMd),
          Text(
            'No ${selectedTab.toLowerCase()} orders',
            style: AppTextStyles.heading5.copyWith(color: AppColors.grey600),
          ),
          const SizedBox(height: Dimensions.spacingSm),
          Text(
            selectedTab == 'All' 
                ? 'You haven\'t placed any orders yet'
                : 'No orders found in this category',
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey400),
          ),
          if (selectedTab == 'All') ...[
            const SizedBox(height: Dimensions.spacingLg),
            ElevatedButton(
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => const ProductsListScreen()));
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: Dimensions.paddingXl,
                  vertical: Dimensions.paddingMd,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                ),
              ),
              child: const Text('Start Shopping'),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildOrderCard(Order order) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: InkWell(
        borderRadius: BorderRadius.circular(Dimensions.radiusMd),
        onTap: () => _navigateToOrderDetails(order),
        child: Padding(
          padding: const EdgeInsets.all(Dimensions.paddingLg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Order header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Order #${order.orderNumber}',
                    style: AppTextStyles.bodyLarge.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimaryLight,
                    ),
                  ),
                  _buildStatusChip(order.status),
                ],
              ),
              const SizedBox(height: Dimensions.spacingSm),
              
              Text(
                'Placed on ${order.formattedOrderDate}',
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
              ),
              
              const SizedBox(height: Dimensions.spacingMd),
              
              // Order items summary
              Text(
                '${order.totalItems} item${order.totalItems > 1 ? 's' : ''} • ${order.formattedTotal}',
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.primary,
                ),
              ),
              
              const SizedBox(height: Dimensions.spacingSm),
              
              // First item preview
              if (order.items.isNotEmpty) ...[
                Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                      child: Container(
                        width: 40,
                        height: 40,
                        color: AppColors.grey100,
                        child: order.items.first.productImage?.isNotEmpty == true
                            ? Image.network(
                                order.items.first.productImage!,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => const Icon(
                                  Icons.image,
                                  size: 16,
                                  color: AppColors.grey400,
                                ),
                              )
                            : const Icon(Icons.image, size: 16, color: AppColors.grey400),
                      ),
                    ),
                    const SizedBox(width: Dimensions.spacingMd),
                    Expanded(
                      child: Text(
                        order.items.first.productName,
                        style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (order.items.length > 1)
                      Text(
                        '+${order.items.length - 1} more',
                        style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary),
                      ),
                  ],
                ),
              ],
              
              const SizedBox(height: Dimensions.spacingMd),
              
              // Action buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _navigateToOrderDetails(order),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.primary),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                        ),
                      ),
                      child: Text(
                        'View Details',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  
                  if (order.canBeCancelled) ...[
                    const SizedBox(width: Dimensions.spacingMd),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _cancelOrder(order),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.error,
                          foregroundColor: AppColors.white,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                          ),
                        ),
                        child: Text(
                          'Cancel',
                          style: AppTextStyles.bodySmall.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(OrderStatus status) {
    Color backgroundColor;
    Color textColor;
    
    switch (status) {
      case OrderStatus.pending:
        backgroundColor = AppColors.warning.withValues(alpha: 0.1);
        textColor = AppColors.warning;
        break;
      case OrderStatus.confirmed:
      case OrderStatus.processing:
        backgroundColor = AppColors.info.withValues(alpha: 0.1);
        textColor = AppColors.info;
        break;
      case OrderStatus.shipped:
      case OrderStatus.outForDelivery:
        backgroundColor = AppColors.primary.withValues(alpha: 0.1);
        textColor = AppColors.primary;
        break;
      case OrderStatus.delivered:
        backgroundColor = AppColors.success.withValues(alpha: 0.1);
        textColor = AppColors.success;
        break;
      case OrderStatus.cancelled:
      case OrderStatus.refunded:
        backgroundColor = AppColors.error.withValues(alpha: 0.1);
        textColor = AppColors.error;
        break;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status.name.toUpperCase(),
        style: AppTextStyles.overline.copyWith(
          color: textColor,
          fontWeight: FontWeight.w600,
          fontSize: 10,
        ),
      ),
    );
  }
}