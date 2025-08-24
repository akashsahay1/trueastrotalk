import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../models/cart.dart';
import '../services/cart_service.dart';
import '../services/service_locator.dart';
import 'products_list.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  late final CartService _cartService;
  bool _isUpdating = false;

  @override
  void initState() {
    super.initState();
    _cartService = getIt<CartService>();
    // Listen to cart changes
    _cartService.addListener(_onCartChanged);
  }

  @override
  void dispose() {
    _cartService.removeListener(_onCartChanged);
    super.dispose();
  }

  void _onCartChanged() {
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _updateQuantity(String productId, int quantity) async {
    setState(() {
      _isUpdating = true;
    });

    try {
      await _cartService.updateQuantity(productId, quantity);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update quantity: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    } finally {
      setState(() {
        _isUpdating = false;
      });
    }
  }

  Future<void> _removeFromCart(String productId) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Item'),
        content: const Text('Are you sure you want to remove this item from your cart?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Remove', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (result == true) {
      setState(() {
        _isUpdating = true;
      });

      try {
        await _cartService.removeFromCart(productId);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to remove item: $e'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      } finally {
        setState(() {
          _isUpdating = false;
        });
      }
    }
  }

  Future<void> _clearCart() async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Cart'),
        content: const Text('Are you sure you want to remove all items from your cart?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Clear All', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (result == true) {
      setState(() {
        _isUpdating = true;
      });

      try {
        await _cartService.clearCart();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to clear cart: $e'),
              backgroundColor: AppColors.error,
            ),
          );
        }
      } finally {
        setState(() {
          _isUpdating = false;
        });
      }
    }
  }

  void _proceedToCheckout() {
    final validation = _cartService.validateCart();
    
    if (!validation['is_valid']) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Cart validation failed: ${validation['errors'].join(', ')}'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    Navigator.pushNamed(
      context,
      '/checkout',
      arguments: {
        'cart': _cartService.cart,
        'source': 'cart',
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 243, 245, 249),
      appBar: AppBar(
        title: Text(
          'Shopping Cart (${_cartService.totalItems})',
          style: AppTextStyles.heading4.copyWith(color: AppColors.white),
        ),
        backgroundColor: AppColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          if (_cartService.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep, color: AppColors.white),
              onPressed: _clearCart,
              tooltip: 'Clear Cart',
            ),
        ],
      ),
      body: _cartService.isEmpty
          ? _buildEmptyCartState()
          : Column(
              children: [
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(Dimensions.paddingLg),
                    itemCount: _cartService.items.length,
                    separatorBuilder: (context, index) => const SizedBox(height: Dimensions.spacingMd),
                    itemBuilder: (context, index) => _buildCartItemCard(_cartService.items[index]),
                  ),
                ),
                _buildCartSummary(),
              ],
            ),
    );
  }

  Widget _buildEmptyCartState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.shopping_cart_outlined,
            size: 64,
            color: AppColors.grey400,
          ),
          const SizedBox(height: Dimensions.spacingMd),
          Text(
            'Your cart is empty',
            style: AppTextStyles.heading5.copyWith(color: AppColors.grey600),
          ),
          const SizedBox(height: Dimensions.spacingSm),
          Text(
            'Add some products to get started',
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey400),
          ),
          const SizedBox(height: Dimensions.spacingLg),
          ElevatedButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const ProductsListScreen(),
                ),
              );
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
            child: const Text('Continue Shopping'),
          ),
        ],
      ),
    );
  }

  Widget _buildCartItemCard(CartItem item) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingMd),
        child: Row(
          children: [
            // Product Image
            ClipRRect(
              borderRadius: BorderRadius.circular(Dimensions.radiusSm),
              child: Container(
                width: 80,
                height: 80,
                color: AppColors.grey100,
                child: _buildProductImage(item),
              ),
            ),
            const SizedBox(width: Dimensions.spacingMd),
            
            // Product Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.productName,
                    style: AppTextStyles.bodyLarge.copyWith(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimaryLight,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.category,
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.formattedUnitPrice,
                            style: AppTextStyles.bodyMedium.copyWith(
                              color: AppColors.grey600,
                            ),
                          ),
                          Text(
                            item.formattedTotalPrice,
                            style: AppTextStyles.bodyLarge.copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                      // Quantity Controls
                      _buildQuantityControls(item),
                    ],
                  ),
                ],
              ),
            ),
            
            // Remove Button
            IconButton(
              onPressed: () => _removeFromCart(item.productId),
              icon: const Icon(Icons.delete_outline, color: AppColors.error),
              tooltip: 'Remove from cart',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductImage(CartItem item) {
    if (item.productImage?.isNotEmpty == true) {
      return Image.network(
        item.productImage!,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return _buildPlaceholderImage();
        },
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return const Center(
            child: CircularProgressIndicator(strokeWidth: 2),
          );
        },
      );
    }
    
    return _buildPlaceholderImage();
  }

  Widget _buildPlaceholderImage() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      color: AppColors.grey100,
      child: const Icon(Icons.image, size: 30, color: AppColors.grey400),
    );
  }

  Widget _buildQuantityControls(CartItem item) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildQuantityButton(
          icon: Icons.remove,
          onPressed: item.quantity > 1 
              ? () => _updateQuantity(item.productId, item.quantity - 1)
              : null,
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: Dimensions.spacingSm),
          padding: const EdgeInsets.symmetric(
            horizontal: Dimensions.paddingSm,
            vertical: 4,
          ),
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.borderLight),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            item.quantity.toString(),
            style: AppTextStyles.bodyMedium.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        _buildQuantityButton(
          icon: Icons.add,
          onPressed: () => _updateQuantity(item.productId, item.quantity + 1),
        ),
      ],
    );
  }

  Widget _buildQuantityButton({
    required IconData icon,
    required VoidCallback? onPressed,
  }) {
    return SizedBox(
      width: 32,
      height: 32,
      child: ElevatedButton(
        onPressed: _isUpdating ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: onPressed != null ? AppColors.primary : AppColors.grey300,
          foregroundColor: AppColors.white,
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        child: Icon(icon, size: 16),
      ),
    );
  }

  Widget _buildCartSummary() {
    final summary = _cartService.getCartSummary();
    
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
            
            _buildSummaryRow('Subtotal', summary['formatted_subtotal']),
            _buildSummaryRow('Shipping', summary['formatted_shipping']),
            _buildSummaryRow('Tax (GST)', summary['formatted_tax']),
            
            const Divider(),
            
            _buildSummaryRow(
              'Total',
              summary['formatted_total'],
              isTotal: true,
            ),
            
            const SizedBox(height: Dimensions.spacingLg),
            
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isUpdating ? null : _proceedToCheckout,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: AppColors.white,
                  padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingMd),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                  ),
                ),
                child: _isUpdating
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
                            'Proceed to Checkout',
                            style: AppTextStyles.bodyLarge.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
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
}