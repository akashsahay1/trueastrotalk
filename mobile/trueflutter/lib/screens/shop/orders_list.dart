import 'package:flutter/material.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/constants/dimensions.dart';
import '../../config/config.dart';
import '../../models/order.dart';
import '../../models/address.dart';
import '../../models/enums.dart' hide PaymentStatus;
import '../../services/service_locator.dart';
import '../../services/api/orders_api_service.dart';
import '../../services/auth/auth_service.dart';
import '../../services/local/local_storage_service.dart';
import 'order_details.dart';
import 'products_list.dart';

class OrdersListScreen extends StatefulWidget {
  const OrdersListScreen({super.key});

  @override
  State<OrdersListScreen> createState() => _OrdersListScreenState();
}

class _OrdersListScreenState extends State<OrdersListScreen> {
  late final OrdersApiService _ordersApiService;
  late final LocalStorageService _localStorage;
  late final AuthService _authService;
  final ScrollController _scrollController = ScrollController();

  List<Order> _allOrders = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  int _currentPage = 1;
  static const int _pageSize = 10;

  @override
  void initState() {
    super.initState();
    _ordersApiService = getIt<OrdersApiService>();
    _localStorage = getIt<LocalStorageService>();
    _authService = getIt<AuthService>();
    _scrollController.addListener(_onScroll);
    _loadOrders();
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _loadMoreOrders();
    }
  }

  Future<void> _loadOrders() async {
    setState(() {
      _isLoading = true;
      _currentPage = 1;
      _hasMore = true;
    });

    try {
      // Get custom user ID from local storage (not MongoDB ObjectId)
      final userId = _localStorage.getUserId() ?? 'user123';
      debugPrint('🔍 Loading orders for user_id: $userId (page: $_currentPage)');
      debugPrint('🌐 API call: ${Config.baseUrl}/api/orders?userId=$userId');

      // Fetch orders from API - use actual user role
      final userType = _authService.currentUser?.role.value ?? 'customer';
      final result = await _ordersApiService.getOrders(
        userId: userId,
        userType: userType,
        limit: _pageSize,
        page: _currentPage,
      );

      if (result['success']) {
        final List<Order> orders = result['orders'];
        _allOrders = orders;
        _hasMore = orders.length >= _pageSize;
        debugPrint('✅ API Success: Loaded ${orders.length} orders (hasMore: $_hasMore)');
      } else {
        // Fallback to sample data if API fails
        _allOrders = _getSampleOrders();
        _hasMore = false;
        debugPrint('❌ API Failed: Using ${_allOrders.length} sample orders. Error: ${result['error']}');
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['error'] ?? 'Failed to load orders')),
          );
        }
      }
    } catch (e) {
      debugPrint('❌ Exception loading orders: $e');
      _allOrders = _getSampleOrders();
      _hasMore = false;
      debugPrint('🔄 Using ${_allOrders.length} sample orders due to exception');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMoreOrders() async {
    if (_isLoadingMore || !_hasMore) return;

    setState(() {
      _isLoadingMore = true;
    });

    try {
      final userId = _localStorage.getUserId() ?? 'user123';
      final userType = _authService.currentUser?.role.value ?? 'customer';
      final nextPage = _currentPage + 1;

      debugPrint('🔍 Loading more orders (page: $nextPage)');

      final result = await _ordersApiService.getOrders(
        userId: userId,
        userType: userType,
        limit: _pageSize,
        page: nextPage,
      );

      if (result['success']) {
        final List<Order> newOrders = result['orders'];
        if (newOrders.isNotEmpty) {
          _allOrders.addAll(newOrders);
          _currentPage = nextPage;
          _hasMore = newOrders.length >= _pageSize;
          debugPrint('✅ Loaded ${newOrders.length} more orders (total: ${_allOrders.length}, hasMore: $_hasMore)');
        } else {
          _hasMore = false;
          debugPrint('📭 No more orders to load');
        }
      }
    } catch (e) {
      debugPrint('❌ Error loading more orders: $e');
    } finally {
      setState(() {
        _isLoadingMore = false;
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
      Order(
        id: '4',
        orderNumber: 'ORD-2024-004',
        userId: 'user1',
        items: [
          OrderItem(
            productId: 'p5',
            productName: 'Meditation Cushion',
            productPrice: 1299,
            category: 'Spiritual Items',
            quantity: 1,
            totalPrice: 1299,
          ),
        ],
        subtotal: 1299,
        shippingCost: 50,
        taxAmount: 233.82,
        totalAmount: 1582.82,
        status: OrderStatus.confirmed,
        paymentStatus: PaymentStatus.completed,
        paymentMethod: PaymentMethod.razorpay,
        paymentId: 'pay_1111222233',
        shippingAddress: sampleAddress,
        orderDate: DateTime.now().subtract(const Duration(hours: 12)),
        expectedDeliveryDate: DateTime.now().add(const Duration(days: 5)),
        createdAt: DateTime.now().subtract(const Duration(hours: 12)),
      ),
      Order(
        id: '5',
        orderNumber: 'ORD-2024-005',
        userId: 'user1',
        items: [
          OrderItem(
            productId: 'p6',
            productName: 'Cancelled Item',
            productPrice: 599,
            category: 'Test',
            quantity: 1,
            totalPrice: 599,
          ),
        ],
        subtotal: 599,
        shippingCost: 50,
        taxAmount: 107.82,
        totalAmount: 756.82,
        status: OrderStatus.cancelled,
        paymentStatus: PaymentStatus.failed,
        paymentMethod: PaymentMethod.razorpay,
        shippingAddress: sampleAddress,
        orderDate: DateTime.now().subtract(const Duration(days: 1)),
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
    ];
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

    final result = await showDialog<Map<String, dynamic>?>(
      context: context,
      builder: (context) => _CancelOrderDialog(orderNumber: order.orderNumber ?? 'Unknown'),
    );

    if (result != null && result['cancelled'] == true) {
      // Call API to cancel order
      try {
        final userId = _localStorage.getUserId() ?? 'user123';
        final cancelResult = await _ordersApiService.cancelOrder(
          orderId: order.id ?? '',
          userId: userId,
          reason: result['reason'] ?? 'Cancelled by customer',
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
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _allOrders.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadOrders,
                  color: AppColors.primary,
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(Dimensions.paddingLg),
                    itemCount: _allOrders.length + (_hasMore ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == _allOrders.length) {
                        // Loading indicator at the bottom
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingMd),
                          child: Center(
                            child: _isLoadingMore
                                ? const CircularProgressIndicator()
                                : const SizedBox.shrink(),
                          ),
                        );
                      }
                      return Padding(
                        padding: EdgeInsets.only(
                          bottom: index < _allOrders.length - 1 ? Dimensions.spacingMd : 0,
                        ),
                        child: _buildOrderCard(_allOrders[index]),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildEmptyState() {
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
            'No orders yet',
            style: AppTextStyles.heading5.copyWith(color: AppColors.grey600),
          ),
          const SizedBox(height: Dimensions.spacingSm),
          Text(
            'You haven\'t placed any orders yet',
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey400),
          ),
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
              Text(
                'Order #${order.orderNumber}',
                style: AppTextStyles.bodyLarge.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimaryLight,
                ),
              ),
              const SizedBox(height: Dimensions.spacingXs),
              _buildStatusChip(order.status),
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

class _CancelOrderDialog extends StatefulWidget {
  final String orderNumber;

  const _CancelOrderDialog({required this.orderNumber});

  @override
  State<_CancelOrderDialog> createState() => _CancelOrderDialogState();
}

class _CancelOrderDialogState extends State<_CancelOrderDialog> {
  final TextEditingController _reasonController = TextEditingController();
  String _selectedReason = '';
  
  final List<String> _commonReasons = [
    'Changed my mind',
    'Found a better price',
    'Ordered by mistake',
    'Product no longer needed',
    'Delivery taking too long',
    'Other (please specify)',
  ];

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.white,
      title: const Text(
        'Cancel Order',
        style: TextStyle(
          color: AppColors.textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      content: SizedBox(
        width: double.maxFinite,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Are you sure you want to cancel order #${widget.orderNumber}?',
              style: const TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Please select a reason:',
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            // ignore: deprecated_member_use
            ...List.generate(_commonReasons.length, (index) {
              final reason = _commonReasons[index];
              return RadioListTile<String>(
                value: reason,
                // ignore: deprecated_member_use
                groupValue: _selectedReason,
                // ignore: deprecated_member_use
                onChanged: (value) {
                  setState(() {
                    _selectedReason = value ?? '';
                  });
                },
                title: Text(
                  reason,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 13,
                  ),
                ),
                contentPadding: EdgeInsets.zero,
                dense: true,
              );
            }),
            if (_selectedReason == 'Other (please specify)') ...[
              const SizedBox(height: 8),
              TextField(
                controller: _reasonController,
                decoration: const InputDecoration(
                  hintText: 'Please specify your reason...',
                  hintStyle: TextStyle(color: AppColors.textSecondary),
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.all(12),
                ),
                maxLines: 2,
                style: const TextStyle(color: AppColors.textPrimary),
              ),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(null),
          child: const Text(
            'No',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        TextButton(
          onPressed: _selectedReason.isEmpty ? null : () {
            final reason = _selectedReason == 'Other (please specify)'
                ? _reasonController.text.trim()
                : _selectedReason;
            
            if (reason.isEmpty) return;
            
            Navigator.of(context).pop({
              'cancelled': true,
              'reason': reason,
            });
          },
          child: Text(
            'Yes, Cancel',
            style: TextStyle(
              color: _selectedReason.isEmpty ? AppColors.textSecondary : AppColors.error,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}