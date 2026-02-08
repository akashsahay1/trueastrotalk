import 'package:flutter/material.dart';
import '../../common/themes/app_colors.dart';
import '../../common/themes/text_styles.dart';
import '../../common/constants/dimensions.dart';
import '../../models/order.dart';
import '../../models/user.dart';
import '../../models/enums.dart';
import '../../services/service_locator.dart';
import '../../services/api/orders_api_service.dart';
import '../../services/auth/auth_service.dart';
import '../../services/email/email_service.dart';
import '../shop/order_details.dart';

class AdminOrdersManagementScreen extends StatefulWidget {
  const AdminOrdersManagementScreen({super.key});

  @override
  State<AdminOrdersManagementScreen> createState() => _AdminOrdersManagementScreenState();
}

class _AdminOrdersManagementScreenState extends State<AdminOrdersManagementScreen> 
    with SingleTickerProviderStateMixin {
  late final OrdersApiService _ordersApiService;
  late final AuthService _authService;
  late final EmailService _emailService;
  late TabController _tabController;
  
  List<Order> _allOrders = [];
  bool _isLoading = true;
  String? _error;

  final List<String> _tabs = ['All', 'Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

  @override
  void initState() {
    super.initState();
    _ordersApiService = getIt<OrdersApiService>();
    _authService = getIt<AuthService>();
    _emailService = EmailService.instance;
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
      _error = null;
    });

    try {
      // Load all orders for admin (different endpoint than user orders)
      final result = await _ordersApiService.getOrders(
        userId: 'admin', // Special admin user ID
        userType: 'admin',
        limit: 100, // Load more orders for admin
      );
      
      if (result['success']) {
        _allOrders = result['orders'];
      } else {
        _error = result['error'] ?? 'Failed to load orders';
      }
    } catch (e) {
      debugPrint('Error loading admin orders: $e');
      _error = 'Failed to load orders: $e';
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  List<Order> _getFilteredOrders(String status) {
    if (status == 'All') return _allOrders;
    
    final filterStatus = _parseStatusFilter(status);
    return _allOrders.where((order) => order.status == filterStatus).toList();
  }

  OrderStatus _parseStatusFilter(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return OrderStatus.pending;
      case 'confirmed':
        return OrderStatus.confirmed;
      case 'shipped':
        return OrderStatus.shipped;
      case 'delivered':
        return OrderStatus.delivered;
      case 'cancelled':
        return OrderStatus.cancelled;
      default:
        return OrderStatus.pending;
    }
  }

  Future<void> _updateOrderStatus(Order order, OrderStatus newStatus) async {
    try {
      final result = await _ordersApiService.updateOrderStatus(
        orderId: order.id!,
        status: newStatus.name,
      );

      if (result['success']) {
        // Send status update email to customer
        final currentUser = _authService.currentUser;
        if (currentUser != null) {
          final userForEmail = User(
            id: order.userId,
            name: order.shippingAddress.fullName,
            email: '', // In real app, you'd fetch customer email
            role: UserRole.customer,
            accountStatus: AccountStatus.active,
            verificationStatus: VerificationStatus.verified,
            authType: AuthType.email,
            createdAt: DateTime.now(),
            updatedAt: DateTime.now(),
          );
          
          await _emailService.sendOrderStatusUpdateEmail(
            order: order,
            user: userForEmail,
            authToken: _authService.authToken!,
            previousStatus: order.status,
          );
        }
        
        // Reload orders to reflect changes
        await _loadOrders();
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Order status updated to ${newStatus.name}'),
              backgroundColor: AppColors.success,
            ),
          );
        }
      } else {
        throw Exception(result['error']);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update order status: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 243, 245, 249),
      appBar: AppBar(
        title: Text(
          'Orders Management',
          style: AppTextStyles.heading4.copyWith(color: AppColors.white),
        ),
        backgroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.white),
            onPressed: _loadOrders,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          labelColor: AppColors.white,
          unselectedLabelColor: AppColors.white.withValues(alpha: 0.7),
          indicatorColor: AppColors.white,
          tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.error_outline, size: 64, color: AppColors.error),
                      const SizedBox(height: 16),
                      Text(_error!, style: AppTextStyles.bodyLarge),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadOrders,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : TabBarView(
                  controller: _tabController,
                  children: _tabs.map((tab) => _buildOrdersList(tab)).toList(),
                ),
    );
  }

  Widget _buildOrdersList(String status) {
    final orders = _getFilteredOrders(status);
    
    if (orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.shopping_bag_outlined, size: 64, color: AppColors.grey400),
            const SizedBox(height: 16),
            Text(
              'No ${status.toLowerCase()} orders found',
              style: AppTextStyles.bodyLarge.copyWith(color: AppColors.grey600),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadOrders,
      child: ListView.separated(
        padding: const EdgeInsets.all(Dimensions.paddingMd),
        itemCount: orders.length,
        separatorBuilder: (context, index) => const SizedBox(height: Dimensions.spacingMd),
        itemBuilder: (context, index) => _buildOrderCard(orders[index]),
      ),
    );
  }

  Widget _buildOrderCard(Order order) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _navigateToOrderDetails(order),
        child: Padding(
          padding: const EdgeInsets.all(Dimensions.paddingMd),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.orderNumber ?? 'Order #${order.id}',
                          style: AppTextStyles.heading6.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Customer: ${order.shippingAddress.fullName}',
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondaryLight,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _buildStatusChip(order.status),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.shopping_cart, size: 16, color: AppColors.grey500),
                  const SizedBox(width: 4),
                  Text(
                    '${order.totalItems} items',
                    style: AppTextStyles.bodySmall,
                  ),
                  const SizedBox(width: 16),
                  Icon(Icons.payment, size: 16, color: AppColors.grey500),
                  const SizedBox(width: 4),
                  Text(
                    order.paymentMethodDisplayName,
                    style: AppTextStyles.bodySmall,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    order.formattedTotal,
                    style: AppTextStyles.heading6.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    order.formattedOrderDate,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.grey600,
                    ),
                  ),
                ],
              ),
              if (order.status == OrderStatus.pending || order.status == OrderStatus.confirmed) ...[
                const SizedBox(height: 12),
                _buildActionButtons(order),
              ],
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
        backgroundColor = AppColors.info.withValues(alpha: 0.1);
        textColor = AppColors.info;
        break;
      case OrderStatus.shipped:
        backgroundColor = AppColors.primary.withValues(alpha: 0.1);
        textColor = AppColors.primary;
        break;
      case OrderStatus.delivered:
        backgroundColor = AppColors.success.withValues(alpha: 0.1);
        textColor = AppColors.success;
        break;
      case OrderStatus.cancelled:
        backgroundColor = AppColors.error.withValues(alpha: 0.1);
        textColor = AppColors.error;
        break;
      default:
        backgroundColor = AppColors.grey100;
        textColor = AppColors.grey600;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.name.toUpperCase(),
        style: AppTextStyles.bodySmall.copyWith(
          color: textColor,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildActionButtons(Order order) {
    return Row(
      children: [
        if (order.status == OrderStatus.pending) ...[
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () => _updateOrderStatus(order, OrderStatus.confirmed),
              icon: const Icon(Icons.check_circle, size: 16),
              label: const Text('Confirm'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                foregroundColor: AppColors.white,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () => _updateOrderStatus(order, OrderStatus.cancelled),
              icon: const Icon(Icons.cancel, size: 16),
              label: const Text('Cancel'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.error,
                side: const BorderSide(color: AppColors.error),
              ),
            ),
          ),
        ] else if (order.status == OrderStatus.confirmed) ...[
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () => _updateOrderStatus(order, OrderStatus.shipped),
              icon: const Icon(Icons.local_shipping, size: 16),
              label: const Text('Mark as Shipped'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
              ),
            ),
          ),
        ],
      ],
    );
  }

  void _navigateToOrderDetails(Order order) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => OrderDetailsScreen(order: order),
      ),
    );
  }
}