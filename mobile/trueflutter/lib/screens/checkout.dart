import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../models/cart.dart';
import '../models/address.dart';
import '../models/order.dart';
import '../services/service_locator.dart';
import '../services/cart_service.dart';
import '../services/auth/auth_service.dart';
import '../services/payment/razorpay_service.dart';
import '../services/email/email_service.dart';
import '../services/api/orders_api_service.dart';
import 'address_list.dart';
import 'order_success.dart';

class CheckoutScreen extends StatefulWidget {
  final Cart? cart;
  final String source; // 'cart' or 'buy_now'

  const CheckoutScreen({
    super.key,
    this.cart,
    this.source = 'cart',
  });

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  late final CartService _cartService;
  late final AuthService _authService;
  late final RazorpayService _razorpayService;
  late final EmailService _emailService;
  late final OrdersApiService _ordersApiService;
  
  Cart? _currentCart;
  Address? _selectedAddress;
  PaymentMethod _selectedPaymentMethod = PaymentMethod.razorpay;
  
  bool _isPlacingOrder = false;
  
  final TextEditingController _notesController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cartService = getIt<CartService>();
    _authService = getIt<AuthService>();
    _razorpayService = getIt<RazorpayService>();
    _emailService = getIt<EmailService>();
    _ordersApiService = getIt<OrdersApiService>();
    
    _currentCart = widget.cart ?? _cartService.cart;
    
    // Initialize Razorpay
    _razorpayService.initializeRazorpay(
      onPaymentSuccess: _handlePaymentSuccess,
      onPaymentError: _handlePaymentError,
      onExternalWallet: _handleExternalWallet,
    );
  }

  @override
  void dispose() {
    _notesController.dispose();
    _razorpayService.dispose();
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    debugPrint('Payment Success: ${response.paymentId}');
    _processOrderSuccess(response.paymentId!, response.orderId);
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    debugPrint('Payment Error: ${response.code} - ${response.message}');
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Payment failed: ${response.message}'),
        backgroundColor: AppColors.error,
      ),
    );
    setState(() {
      _isPlacingOrder = false;
    });
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    debugPrint('External Wallet: ${response.walletName}');
  }

  Future<void> _selectAddress() async {
    final selectedAddress = await Navigator.push<Address>(
      context,
      MaterialPageRoute(
        builder: (context) => const AddressListScreen(),
      ),
    );

    if (selectedAddress != null) {
      setState(() {
        _selectedAddress = selectedAddress;
      });
    }
  }

  double _calculateShipping() {
    if (_currentCart?.isEmpty ?? true) return 0.0;
    if ((_currentCart?.totalPrice ?? 0) >= 500) return 0.0;
    return 50.0;
  }

  double _calculateTax() {
    return (_currentCart?.totalPrice ?? 0) * 0.18;
  }

  double _getFinalTotal() {
    final subtotal = _currentCart?.totalPrice ?? 0;
    return subtotal + _calculateShipping() + _calculateTax();
  }

  Future<void> _placeOrder() async {
    if (_selectedAddress == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a delivery address'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_currentCart?.isEmpty ?? true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Your cart is empty'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() {
      _isPlacingOrder = true;
    });

    try {
      if (_selectedPaymentMethod == PaymentMethod.cod) {
        await _processCODOrder();
      } else {
        await _processOnlinePayment();
      }
    } catch (e) {
      setState(() {
        _isPlacingOrder = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to place order: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  Future<void> _processCODOrder() async {
    // Create order directly for COD
    final order = await _createOrder(PaymentMethod.cod, null, null);
    
    // Clear cart if source is cart
    if (widget.source == 'cart') {
      await _cartService.clearCart();
    }
    
    _navigateToOrderSuccess(order);
  }

  Future<void> _processOnlinePayment() async {
    final user = _authService.currentUser;
    if (user == null) {
      throw Exception('User not logged in');
    }

    final options = _razorpayService.createPaymentOptions(
      amount: _getFinalTotal(),
      orderId: 'order_${DateTime.now().millisecondsSinceEpoch}',
      userEmail: user.email ?? '',
      userContact: user.phone ?? '',
    );

    _razorpayService.openCheckout(options);
  }

  Future<void> _processOrderSuccess(String paymentId, String? razorpayOrderId) async {
    try {
      final order = await _createOrder(
        PaymentMethod.razorpay,
        paymentId,
        razorpayOrderId,
      );
      
      // Clear cart if source is cart
      if (widget.source == 'cart') {
        await _cartService.clearCart();
      }
      
      _navigateToOrderSuccess(order);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Order processing failed: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      setState(() {
        _isPlacingOrder = false;
      });
    }
  }

  Future<Order> _createOrder(
    PaymentMethod paymentMethod,
    String? paymentId,
    String? razorpayOrderId,
  ) async {
    final user = _authService.currentUser;
    if (user == null) {
      throw Exception('User not logged in');
    }

    final orderItems = _currentCart!.items
        .map((cartItem) => OrderItem.fromCartItem(cartItem))
        .toList();

    // Save order to backend
    final result = await _ordersApiService.createOrder(
      userId: user.id,
      items: orderItems.map((item) => {
        'product_id': item.productId,
        'product_name': item.productName,
        'quantity': item.quantity,
        'price': item.productPrice,
        'category': item.category,
      }).toList(),
      shippingAddress: _selectedAddress!,
      paymentMethod: paymentMethod.name,
      paymentDetails: {
        if (paymentId != null) 'payment_id': paymentId,
        if (razorpayOrderId != null) 'razorpay_order_id': razorpayOrderId,
        if (_notesController.text.trim().isNotEmpty) 'notes': _notesController.text.trim(),
      },
    );
    
    if (!result['success']) {
      throw Exception(result['error'] ?? 'Failed to create order');
    }
    
    // Get the created order from API response
    final savedOrder = result['order'] as Order;
    
    // Send order confirmation email
    final authToken = _authService.authToken;
    if (authToken != null) {
      try {
        await _emailService.sendOrderConfirmationEmail(
          order: savedOrder,
          user: user,
          authToken: authToken,
        );
        debugPrint('✅ Order confirmation email sent');
      } catch (e) {
        debugPrint('❌ Failed to send order confirmation email: $e');
        // Don't fail the order creation if email fails
      }
    }
    
    return savedOrder;
  }

  void _navigateToOrderSuccess(Order order) {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => OrderSuccessScreen(order: order),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 243, 245, 249),
      appBar: AppBar(
        title: Text('Checkout', style: AppTextStyles.heading4.copyWith(color: AppColors.white)),
        backgroundColor: AppColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _currentCart?.isEmpty ?? true
          ? _buildEmptyState()
          : Column(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(Dimensions.paddingLg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildDeliveryAddressSection(),
                        const SizedBox(height: Dimensions.spacingLg),
                        _buildOrderItemsSection(),
                        const SizedBox(height: Dimensions.spacingLg),
                        _buildPaymentMethodSection(),
                        const SizedBox(height: Dimensions.spacingLg),
                        _buildOrderNotesSection(),
                        const SizedBox(height: Dimensions.spacingLg),
                        _buildOrderSummarySection(),
                      ],
                    ),
                  ),
                ),
                _buildPlaceOrderButton(),
              ],
            ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_cart_outlined, size: 64, color: AppColors.grey400),
          SizedBox(height: Dimensions.spacingMd),
          Text(
            'No items to checkout',
            style: TextStyle(color: AppColors.grey600, fontSize: 18),
          ),
        ],
      ),
    );
  }

  Widget _buildDeliveryAddressSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Delivery Address',
                  style: AppTextStyles.heading6.copyWith(
                    color: AppColors.textPrimaryLight,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: _selectAddress,
                  child: Text(
                    _selectedAddress == null ? 'Add Address' : 'Change',
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.primary),
                  ),
                ),
              ],
            ),
            const SizedBox(height: Dimensions.spacingMd),
            if (_selectedAddress != null) ...[
              Container(
                padding: const EdgeInsets.all(Dimensions.paddingMd),
                decoration: BoxDecoration(
                  color: AppColors.grey50,
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            _selectedAddress!.addressTypeDisplayName,
                            style: AppTextStyles.overline.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        const Spacer(),
                        if (_selectedAddress!.isDefault)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.success.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              'Default',
                              style: AppTextStyles.overline.copyWith(
                                color: AppColors.success,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: Dimensions.spacingSm),
                    Text(
                      _selectedAddress!.fullName,
                      style: AppTextStyles.bodyMedium.copyWith(
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimaryLight,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _selectedAddress!.phoneNumber,
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
                    ),
                    const SizedBox(height: Dimensions.spacingSm),
                    Text(
                      _selectedAddress!.fullAddress,
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
                    ),
                  ],
                ),
              ),
            ] else ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(Dimensions.paddingLg),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 32, color: AppColors.warning),
                    const SizedBox(height: Dimensions.spacingSm),
                    Text(
                      'No delivery address selected',
                      style: AppTextStyles.bodyMedium.copyWith(
                        color: AppColors.warning,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Please add or select a delivery address',
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.warning),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildOrderItemsSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Order Items (${_currentCart?.totalItems ?? 0})',
              style: AppTextStyles.heading6.copyWith(
                color: AppColors.textPrimaryLight,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: Dimensions.spacingMd),
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _currentCart?.items.length ?? 0,
              separatorBuilder: (context, index) => const Divider(),
              itemBuilder: (context, index) {
                final item = _currentCart!.items[index];
                return _buildOrderItem(item);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderItem(CartItem item) {
    return Row(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(Dimensions.radiusSm),
          child: Container(
            width: 60,
            height: 60,
            color: AppColors.grey100,
            child: item.productImage?.isNotEmpty == true
                ? Image.network(
                    item.productImage!,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => const Icon(
                      Icons.image,
                      size: 24,
                      color: AppColors.grey400,
                    ),
                  )
                : const Icon(Icons.image, size: 24, color: AppColors.grey400),
          ),
        ),
        const SizedBox(width: Dimensions.spacingMd),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.productName,
                style: AppTextStyles.bodyMedium.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimaryLight,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                item.category,
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${item.formattedUnitPrice} × ${item.quantity}',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
                  ),
                  Text(
                    item.formattedTotalPrice,
                    style: AppTextStyles.bodyMedium.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentMethodSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Payment Method',
              style: AppTextStyles.heading6.copyWith(
                color: AppColors.textPrimaryLight,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: Dimensions.spacingMd),
            _buildPaymentMethodOption(
              PaymentMethod.razorpay,
              'Online Payment',
              'Pay securely using UPI, Card, or Netbanking',
              Icons.payment,
            ),
            const SizedBox(height: Dimensions.spacingSm),
            _buildPaymentMethodOption(
              PaymentMethod.cod,
              'Cash on Delivery',
              'Pay when your order is delivered',
              Icons.local_shipping,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodOption(
    PaymentMethod method,
    String title,
    String subtitle,
    IconData icon,
  ) {
    final isSelected = _selectedPaymentMethod == method;
    
    return Container(
      decoration: BoxDecoration(
        border: Border.all(
          color: isSelected ? AppColors.primary : AppColors.borderLight,
          width: isSelected ? 2 : 1,
        ),
        borderRadius: BorderRadius.circular(Dimensions.radiusSm),
      ),
      // ignore: deprecated_member_use
      child: RadioListTile<PaymentMethod>(
        value: method,
        // ignore: deprecated_member_use
        groupValue: _selectedPaymentMethod,
        // ignore: deprecated_member_use
        onChanged: (value) {
          setState(() {
            _selectedPaymentMethod = value!;
          });
        },
        title: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? AppColors.primary : AppColors.grey400,
              size: 20,
            ),
            const SizedBox(width: Dimensions.spacingSm),
            Text(
              title,
              style: AppTextStyles.bodyMedium.copyWith(
                fontWeight: FontWeight.w600,
                color: isSelected ? AppColors.primary : AppColors.textPrimaryLight,
              ),
            ),
          ],
        ),
        subtitle: Text(
          subtitle,
          style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
        ),
        activeColor: AppColors.primary,
      ),
    );
  }

  Widget _buildOrderNotesSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Order Notes (Optional)',
              style: AppTextStyles.heading6.copyWith(
                color: AppColors.textPrimaryLight,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: Dimensions.spacingMd),
            TextField(
              controller: _notesController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Any special instructions for delivery...',
                filled: true,
                fillColor: AppColors.grey50,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  borderSide: const BorderSide(color: AppColors.borderLight),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  borderSide: const BorderSide(color: AppColors.primary),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderSummarySection() {
    final subtotal = _currentCart?.totalPrice ?? 0;
    final shipping = _calculateShipping();
    final tax = _calculateTax();
    final total = _getFinalTotal();

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Order Summary',
              style: AppTextStyles.heading6.copyWith(
                color: AppColors.textPrimaryLight,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: Dimensions.spacingMd),
            _buildSummaryRow('Subtotal', '₹${subtotal.toStringAsFixed(2)}'),
            _buildSummaryRow(
              'Shipping',
              shipping == 0 ? 'FREE' : '₹${shipping.toStringAsFixed(2)}',
            ),
            _buildSummaryRow('Tax (GST 18%)', '₹${tax.toStringAsFixed(2)}'),
            const Divider(),
            _buildSummaryRow(
              'Total',
              '₹${total.toStringAsFixed(2)}',
              isTotal: true,
            ),
            if (shipping == 0 && subtotal >= 500) ...[
              const SizedBox(height: Dimensions.spacingSm),
              Container(
                padding: const EdgeInsets.all(Dimensions.paddingSm),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.local_shipping, color: AppColors.success, size: 16),
                    const SizedBox(width: Dimensions.spacingSm),
                    Text(
                      'You saved ₹50 on shipping!',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.success,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: AppTextStyles.bodyMedium.copyWith(
              color: isTotal ? AppColors.textPrimaryLight : AppColors.textSecondaryLight,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: AppTextStyles.bodyMedium.copyWith(
              color: isTotal ? AppColors.primary : AppColors.textPrimaryLight,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceOrderButton() {
    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      decoration: const BoxDecoration(
        color: AppColors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 8,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isPlacingOrder ? null : _placeOrder,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingMd),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Dimensions.radiusMd),
              ),
            ),
            child: _isPlacingOrder
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.shopping_bag, size: 20),
                      const SizedBox(width: Dimensions.spacingSm),
                      Text(
                        'Place Order - ₹${_getFinalTotal().toStringAsFixed(0)}',
                        style: AppTextStyles.bodyLarge.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}