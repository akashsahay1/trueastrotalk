import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../models/cart.dart';
import '../models/order.dart';
import '../models/address.dart';
import '../services/cart_service.dart';
import '../services/service_locator.dart';
import '../services/auth/auth_service.dart';
import '../services/api/orders_api_service.dart';
import '../services/api/user_api_service.dart';
import '../services/wallet/wallet_service.dart';
import '../services/payment/razorpay_service.dart';
import '../services/email/email_service.dart';
import '../config/payment_config.dart';
import '../models/user.dart' as app_user;
import '../screens/order_success.dart';

class CheckoutScreen extends StatefulWidget {
  final Cart cart;

  const CheckoutScreen({super.key, required this.cart});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  late final CartService _cartService;
  late final AuthService _authService;
  late final OrdersApiService _ordersApiService;
  late final WalletService _walletService;
  late final RazorpayService _razorpayService;
  late final EmailService _emailService;
  
  final _formKey = GlobalKey<FormState>();
  bool _isProcessing = false;
  app_user.User? _currentUser;
  PaymentMethod _selectedPaymentMethod = PaymentMethod.wallet;

  // Form controllers
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _pincodeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _cartService = getIt<CartService>();
    _authService = getIt<AuthService>();
    _ordersApiService = getIt<OrdersApiService>();
    _walletService = WalletService.instance;
    _razorpayService = getIt<RazorpayService>();
    _emailService = EmailService.instance;
    _loadUserData();
    _loadWalletBalance();
  }

  Future<void> _loadWalletBalance() async {
    await _walletService.loadWalletBalance();
  }

  void _loadUserData() {
    _currentUser = _authService.currentUser;
    if (_currentUser != null) {
      _nameController.text = _currentUser!.name;
      if (_currentUser!.email != null) {
        _emailController.text = _currentUser!.email!;
      }
      if (_currentUser!.phone != null) {
        _phoneController.text = _currentUser!.phone!;
      }
      // Pre-fill address fields if available
      if (_currentUser!.address != null) {
        _addressController.text = _currentUser!.address!;
      }
      if (_currentUser!.city != null) {
        _cityController.text = _currentUser!.city!;
      }
      if (_currentUser!.state != null) {
        _stateController.text = _currentUser!.state!;
      }
      if (_currentUser!.zip != null) {
        _pincodeController.text = _currentUser!.zip!;
      }
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    super.dispose();
  }

  Future<void> _placeOrder() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isProcessing = true;
    });

    try {
      final summary = _cartService.getCartSummary();
      final totalAmount = summary['total'] as double;

      // Create shipping address
      final shippingAddress = Address(
        fullName: _nameController.text.trim(),
        phoneNumber: _phoneController.text.trim(),
        addressLine1: _addressController.text.trim(),
        addressLine2: '',
        city: _cityController.text.trim(),
        state: _stateController.text.trim(),
        pincode: _pincodeController.text.trim(),
        country: 'India',
        isDefault: false,
        addressType: 'home',
      );

      // Process payment based on selected method
      if (_selectedPaymentMethod == PaymentMethod.wallet) {
        await _processWalletPayment(totalAmount, shippingAddress);
      } else if (_selectedPaymentMethod == PaymentMethod.razorpay) {
        await _processRazorpayPayment(totalAmount, shippingAddress);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to place order: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  Future<void> _processWalletPayment(double totalAmount, Address shippingAddress) async {
    // Check wallet balance
    if (_walletService.currentBalance < totalAmount) {
      _showInsufficientBalanceDialog(totalAmount);
      return;
    }

    // Create order
    final orderResult = await _createOrder(shippingAddress, PaymentMethod.wallet);
    if (orderResult != null) {
      // Payment successful, navigate to success screen
      _navigateToOrderSuccess(orderResult);
    }
  }

  Future<void> _processRazorpayPayment(double totalAmount, Address shippingAddress) async {
    try {
      // Ensure PaymentConfig is initialized
      if (PaymentConfig.instance.razorpayKeyId?.isEmpty ?? true) {
        debugPrint('⚠️ PaymentConfig not initialized, initializing now...');
        await PaymentConfig.instance.initialize();
      }
      
      // Create Razorpay order on backend first
      debugPrint('🔄 Creating Razorpay order for ₹$totalAmount');
      
      final authService = getIt<AuthService>();
      final userApiService = getIt<UserApiService>();
      final token = authService.authToken;
      
      if (token == null) {
        throw Exception('Authentication required');
      }
      
      // Generate unique receipt for the order
      final timestamp = DateTime.now().millisecondsSinceEpoch.toString();
      final shortUserId = _currentUser!.id.length > 8 
          ? _currentUser!.id.substring(_currentUser!.id.length - 8) 
          : _currentUser!.id;
      final receipt = 'order_${shortUserId}_$timestamp';
      final finalReceipt = receipt.length > 40 ? receipt.substring(0, 40) : receipt;
      
      // Create Razorpay order on backend
      final orderData = await userApiService.createRazorpayOrder(
        token,
        amount: totalAmount,
        receipt: finalReceipt,
        purpose: 'product_purchase',
        orderType: 'order',
      );
      
      final razorpayOrderId = orderData['id'] as String;
      debugPrint('✅ Razorpay order created: $razorpayOrderId');
      
      // Initialize Razorpay with callbacks
      _razorpayService.initializeRazorpay(
        onPaymentSuccess: (PaymentSuccessResponse response) async {
          debugPrint('🎉 Payment successful: ${response.paymentId}');
          
          // Create order with payment details
          final orderResult = await _createOrder(
            shippingAddress, 
            PaymentMethod.razorpay,
            paymentDetails: {
              'payment_id': response.paymentId,
              'razorpay_order_id': response.orderId,
              'razorpay_payment_id': response.paymentId,
              'amount': totalAmount,
            },
          );
          
          if (orderResult != null) {
            _navigateToOrderSuccess(orderResult);
          }
        },
        onPaymentError: (PaymentFailureResponse response) {
          debugPrint('❌ Payment failed: ${response.message}');
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Payment failed: ${response.message}'),
                backgroundColor: AppColors.error,
              ),
            );
          }
        },
        onExternalWallet: (ExternalWalletResponse response) {
          debugPrint('📱 External wallet: ${response.walletName}');
        },
      );

      // Create payment options with real Razorpay order ID
      final options = _razorpayService.createPaymentOptions(
        amount: totalAmount,
        orderId: razorpayOrderId, // Use real Razorpay order ID
        userEmail: _currentUser?.email ?? '',
        userContact: _currentUser?.phone ?? '',
        customerName: _currentUser?.name ?? 'Customer',
        description: 'Order Payment - ${widget.cart.items.length} items',
      );

      // Open checkout
      debugPrint('🚀 Opening Razorpay checkout with order: $razorpayOrderId');
      _razorpayService.openCheckout(options);
    } catch (e) {
      debugPrint('❌ Razorpay payment setup failed: $e');
      throw Exception('Razorpay payment failed: $e');
    }
  }

  Future<Order?> _createOrder(Address shippingAddress, PaymentMethod paymentMethod, {Map<String, dynamic>? paymentDetails}) async {
    // Prepare order items
    final orderItems = widget.cart.items.map((item) => item.toJson()).toList();

    // Create order via API
    final result = await _ordersApiService.createOrder(
      userId: _currentUser!.id,
      items: orderItems,
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod.name,
      paymentDetails: paymentDetails,
    );

    if (result['success']) {
      final order = result['order'] as Order;
      
      // Send order confirmation email
      if (_currentUser?.email?.isNotEmpty == true) {
        _sendOrderConfirmationEmail(order);
      }
      
      // Clear cart after successful order
      await _cartService.clearCart();
      return order;
    } else {
      throw Exception(result['error'] ?? 'Failed to create order');
    }
  }

  void _sendOrderConfirmationEmail(Order order) async {
    try {
      final token = _authService.authToken;
      if (token != null && _currentUser != null) {
        debugPrint('📧 Sending order confirmation email...');
        final result = await _emailService.sendOrderConfirmationEmail(
          order: order,
          user: _currentUser!,
          authToken: token,
        );
        
        if (result.isSuccess) {
          debugPrint('✅ Order confirmation email sent successfully');
        } else {
          debugPrint('❌ Failed to send order confirmation email: ${result.message}');
        }
      }
    } catch (e) {
      debugPrint('❌ Error sending order confirmation email: $e');
    }
  }

  void _showInsufficientBalanceDialog(double requiredAmount) {
    final shortfall = requiredAmount - _walletService.currentBalance;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.white,
        surfaceTintColor: AppColors.white,
        title: Row(
          children: [
            Icon(Icons.account_balance_wallet, color: AppColors.error),
            const SizedBox(width: 8),
            Text(
              'Insufficient Balance',
              style: AppTextStyles.heading6.copyWith(color: AppColors.textPrimaryLight),
            ),
          ],
        ),
        content: Text(
          'You need ₹${requiredAmount.toStringAsFixed(2)} to complete this order.\n'
          'Current balance: ₹${_walletService.currentBalance.toStringAsFixed(2)}\n'
          'Please add ₹${shortfall.toStringAsFixed(2)} to your wallet.',
          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('Cancel', style: TextStyle(color: AppColors.textSecondaryLight)),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              // Navigate to wallet screen to add money
              Navigator.of(context).pushReplacementNamed('/wallet');
            },
            child: Text('Add Money', style: TextStyle(color: AppColors.primary)),
          ),
        ],
      ),
    );
  }

  void _navigateToOrderSuccess(Order order) {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => OrderSuccessScreen(order: order),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final summary = _cartService.getCartSummary();

    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 243, 245, 249),
      appBar: AppBar(
        title: Text(
          'Checkout',
          style: AppTextStyles.heading4.copyWith(color: AppColors.white),
        ),
        backgroundColor: AppColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildOrderSummary(summary),
                    const SizedBox(height: 24),
                    _buildDeliveryAddressSection(),
                    const SizedBox(height: 24),
                    _buildPaymentMethodSection(),
                    const SizedBox(height: 100), // Space for bottom button
                  ],
                ),
              ),
            ),
          ),
          _buildPlaceOrderButton(summary),
        ],
      ),
    );
  }

  Widget _buildOrderSummary(Map<String, dynamic> summary) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Order Summary',
            style: AppTextStyles.heading6.copyWith(
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 16),
          ...widget.cart.items.map((item) => _buildOrderItem(item)),
          const Divider(height: 24),
          _buildSummaryRow('Subtotal', summary['formatted_subtotal']),
          _buildSummaryRow('Shipping', summary['formatted_shipping']),
          _buildSummaryRow('Tax (GST)', summary['formatted_tax']),
          const Divider(height: 16),
          _buildSummaryRow('Total', summary['formatted_total'], isTotal: true),
        ],
      ),
    );
  }

  Widget _buildOrderItem(CartItem item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Container(
              width: 50,
              height: 50,
              color: AppColors.grey100,
              child: _buildProductImage(item),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.productName,
                  style: AppTextStyles.bodyMedium.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  'Qty: ${item.quantity} × ${item.formattedUnitPrice}',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.grey600,
                  ),
                ),
              ],
            ),
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

  Widget _buildDeliveryAddressSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Delivery Address',
            style: AppTextStyles.heading6.copyWith(
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _nameController,
            label: 'Full Name',
            validator: (value) {
              if (value?.isEmpty ?? true) return 'Please enter your full name';
              return null;
            },
          ),
          const SizedBox(height: 12),
          _buildTextField(
            controller: _emailController,
            label: 'Email',
            keyboardType: TextInputType.emailAddress,
            validator: (value) {
              if (value?.isEmpty ?? true) return 'Please enter your email';
              if (!value!.contains('@')) return 'Please enter a valid email';
              return null;
            },
          ),
          const SizedBox(height: 12),
          _buildTextField(
            controller: _phoneController,
            label: 'Phone Number',
            keyboardType: TextInputType.phone,
            validator: (value) {
              if (value?.isEmpty ?? true) return 'Please enter your phone number';
              if (value!.length < 10) return 'Please enter a valid phone number';
              return null;
            },
          ),
          const SizedBox(height: 12),
          _buildTextField(
            controller: _addressController,
            label: 'Address',
            maxLines: 2,
            validator: (value) {
              if (value?.isEmpty ?? true) return 'Please enter your address';
              return null;
            },
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _cityController,
                  label: 'City',
                  validator: (value) {
                    if (value?.isEmpty ?? true) return 'Please enter city';
                    return null;
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTextField(
                  controller: _stateController,
                  label: 'State',
                  validator: (value) {
                    if (value?.isEmpty ?? true) return 'Please enter state';
                    return null;
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildTextField(
            controller: _pincodeController,
            label: 'Pincode',
            keyboardType: TextInputType.number,
            validator: (value) {
              if (value?.isEmpty ?? true) return 'Please enter pincode';
              if (value!.length != 6) return 'Please enter a valid 6-digit pincode';
              return null;
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType? keyboardType,
    int? maxLines,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines ?? 1,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.primary),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    );
  }

  Widget _buildPaymentMethodSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Payment Method',
            style: AppTextStyles.heading6.copyWith(
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimaryLight,
            ),
          ),
          const SizedBox(height: 16),
          _buildPaymentOption(
            PaymentMethod.wallet,
            'Pay with Wallet',
            Icons.account_balance_wallet,
          ),
          const SizedBox(height: 12),
          _buildPaymentOption(
            PaymentMethod.razorpay,
            'Pay with Razorpay',
            Icons.payment,
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentOption(PaymentMethod method, String title, IconData icon) {
    final isSelected = _selectedPaymentMethod == method;
    final summary = _cartService.getCartSummary();
    final totalAmount = summary['total'] as double;
    final hasEnoughBalance = method == PaymentMethod.wallet 
        ? _walletService.currentBalance >= totalAmount
        : true;
    
    return GestureDetector(
      onTap: hasEnoughBalance ? () {
        setState(() {
          _selectedPaymentMethod = method;
        });
      } : null,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.borderLight,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(8),
          color: isSelected 
              ? AppColors.primary.withValues(alpha: 0.1)
              : hasEnoughBalance 
                  ? AppColors.white
                  : AppColors.grey100,
        ),
        child: Row(
          children: [
            Icon(
              isSelected ? Icons.radio_button_checked : Icons.radio_button_off,
              color: isSelected ? AppColors.primary : AppColors.grey400,
              size: 24,
            ),
            const SizedBox(width: 12),
            Icon(
              icon, 
              color: hasEnoughBalance ? AppColors.primary : AppColors.grey400,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  color: hasEnoughBalance ? AppColors.textPrimaryLight : AppColors.grey500,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceOrderButton(Map<String, dynamic> summary) {
    return Container(
      padding: const EdgeInsets.all(16),
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
            onPressed: _isProcessing ? null : _placeOrder,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: _isProcessing
                ? const SizedBox(
                    width: 24,
                    height: 24,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.white),
                    ),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.shopping_bag, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'Place Order • ${summary['formatted_total']}',
                        style: AppTextStyles.bodyLarge.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }

  Widget _buildProductImage(CartItem item) {
    debugPrint('🖼️ Checkout image URL: ${item.productImage}');
    
    // If cart item doesn't have an image, show placeholder
    if (item.productImage == null || item.productImage!.isEmpty) {
      debugPrint('🖼️ No image URL for checkout item ${item.productName}, showing placeholder');
      return _buildPlaceholderImage();
    }
    
    return Image.network(
      item.productImage!,
      fit: BoxFit.cover,
      errorBuilder: (context, error, stackTrace) {
        debugPrint('❌ Failed to load checkout image: $error for URL: ${item.productImage}');
        return _buildPlaceholderImage();
      },
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;
        return Center(
          child: CircularProgressIndicator(
            value: loadingProgress.expectedTotalBytes != null 
                ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes! 
                : null,
            strokeWidth: 2,
          ),
        );
      },
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: AppColors.grey100,
      child: const Icon(Icons.image, size: 20, color: AppColors.grey400),
    );
  }
}