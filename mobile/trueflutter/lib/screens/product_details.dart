import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../models/product.dart';
import '../services/service_locator.dart';
import '../services/cart_service.dart';
import 'cart.dart';

class ProductDetailsScreen extends StatefulWidget {
  final Product product;

  const ProductDetailsScreen({
    super.key,
    required this.product,
  });

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen> {
  late final CartService _cartService;
  int _quantity = 1;
  bool _isAddingToCart = false;

  @override
  void initState() {
    super.initState();
    _cartService = getIt<CartService>();
  }

  Future<void> _addToCart() async {
    if (!widget.product.isInStock) return;

    setState(() {
      _isAddingToCart = true;
    });

    try {
      await _cartService.addToCart(widget.product, _quantity);
      
      setState(() {
        _isAddingToCart = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${widget.product.name} added to cart'),
            backgroundColor: AppColors.success,
            action: SnackBarAction(
              label: 'View Cart',
              textColor: AppColors.white,
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const CartScreen()),
                );
              },
            ),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isAddingToCart = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to add to cart: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }


  void _buyNow() {
    // Navigate directly to checkout with this product
    Navigator.pushNamed(
      context,
      '/checkout',
      arguments: {
        'items': [
          {
            'product': widget.product,
            'quantity': _quantity,
          }
        ],
        'source': 'buy_now',
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        title: Text('Product Details', style: AppTextStyles.heading4.copyWith(color: AppColors.white)),
        backgroundColor: AppColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
        // Hidden for now - Share and Wishlist functionality not implemented
        // actions: [
        //   IconButton(
        //     icon: const Icon(Icons.share, color: AppColors.white),
        //     onPressed: () => _shareProduct(),
        //   ),
        //   IconButton(
        //     icon: const Icon(Icons.favorite_border, color: AppColors.white),
        //     onPressed: () => _toggleWishlist(),
        //   ),
        // ],
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product Image
                  Container(
                    width: double.infinity,
                    height: 300,
                    color: AppColors.grey100,
                    child: _buildProductImage(),
                  ),
                  
                  // Product Info
                  Padding(
                    padding: const EdgeInsets.all(Dimensions.paddingLg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Product Name and Category
                        Text(
                          widget.product.name,
                          style: AppTextStyles.heading4.copyWith(
                            color: AppColors.textPrimaryLight,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: Dimensions.spacingSm),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: Dimensions.paddingSm,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            widget.product.category,
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: Dimensions.spacingMd),
                        
                        // Price and Stock Status
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              widget.product.formattedPrice,
                              style: AppTextStyles.heading3.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: Dimensions.paddingSm,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: widget.product.isInStock ? AppColors.success : AppColors.error,
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    widget.product.isInStock ? Icons.check_circle : Icons.error,
                                    color: AppColors.white,
                                    size: 16,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    widget.product.stockText,
                                    style: AppTextStyles.bodySmall.copyWith(
                                      color: AppColors.white,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        
                        const SizedBox(height: Dimensions.spacingLg),
                        
                        // Description
                        Text(
                          'Description',
                          style: AppTextStyles.heading6.copyWith(
                            color: AppColors.textPrimaryLight,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: Dimensions.spacingSm),
                        Text(
                          widget.product.description,
                          style: AppTextStyles.bodyMedium.copyWith(
                            color: AppColors.textSecondaryLight,
                            height: 1.5,
                          ),
                        ),
                        
                        const SizedBox(height: Dimensions.spacingLg),
                        
                        // Quantity Selector (if in stock)
                        if (widget.product.isInStock) ...[
                          Text(
                            'Quantity',
                            style: AppTextStyles.heading6.copyWith(
                              color: AppColors.textPrimaryLight,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: Dimensions.spacingSm),
                          Row(
                            children: [
                              _buildQuantityButton(
                                icon: Icons.remove,
                                onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                              ),
                              const SizedBox(width: Dimensions.spacingMd),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: Dimensions.paddingMd,
                                  vertical: Dimensions.paddingSm,
                                ),
                                decoration: BoxDecoration(
                                  border: Border.all(color: AppColors.borderLight),
                                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                                ),
                                child: Text(
                                  _quantity.toString(),
                                  style: AppTextStyles.bodyLarge.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              const SizedBox(width: Dimensions.spacingMd),
                              _buildQuantityButton(
                                icon: Icons.add,
                                onPressed: _quantity < widget.product.stockQuantity
                                    ? () => setState(() => _quantity++)
                                    : null,
                              ),
                            ],
                          ),
                          const SizedBox(height: Dimensions.spacingSm),
                          Text(
                            '${widget.product.stockQuantity} items available',
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.textSecondaryLight,
                            ),
                          ),
                        ],
                        
                        const SizedBox(height: Dimensions.spacingXl),
                        
                        // Product Details
                        _buildProductDetails(),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Bottom Action Buttons
          if (widget.product.isInStock)
            Container(
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
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _isAddingToCart ? null : _addToCart,
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppColors.primary),
                          padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingMd),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                          ),
                        ),
                        child: _isAddingToCart
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.shopping_cart_outlined, size: 20),
                                  const SizedBox(width: Dimensions.spacingSm),
                                  Text(
                                    'Add to Cart',
                                    style: AppTextStyles.bodyMedium.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                    const SizedBox(width: Dimensions.spacingMd),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _buyNow,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.white,
                          padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingMd),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.flash_on, size: 20),
                            const SizedBox(width: Dimensions.spacingSm),
                            Text(
                              'Buy Now',
                              style: AppTextStyles.bodyMedium.copyWith(
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
            ),
        ],
      ),
    );
  }

  Widget _buildProductImage() {
    if (widget.product.fixedImageUrl?.isNotEmpty == true) {
      return Image.network(
        widget.product.fixedImageUrl!,
        fit: BoxFit.cover,
        width: double.infinity,
        errorBuilder: (context, error, stackTrace) {
          debugPrint('❌ Failed to load product image: $error');
          return _buildPlaceholderImage();
        },
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Center(
            child: CircularProgressIndicator(
              value: loadingProgress.expectedTotalBytes != null
                  ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                  : null,
            ),
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
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.image, size: 64, color: AppColors.grey400),
          SizedBox(height: Dimensions.spacingSm),
          Text(
            'No Image Available',
            style: TextStyle(color: AppColors.grey400),
          ),
        ],
      ),
    );
  }

  Widget _buildQuantityButton({
    required IconData icon,
    required VoidCallback? onPressed,
  }) {
    return SizedBox(
      width: 40,
      height: 40,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: onPressed != null ? AppColors.primary : AppColors.grey300,
          foregroundColor: AppColors.white,
          padding: EdgeInsets.zero,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Dimensions.radiusSm),
          ),
        ),
        child: Icon(icon, size: 20),
      ),
    );
  }

  Widget _buildProductDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Product Details',
          style: AppTextStyles.heading6.copyWith(
            color: AppColors.textPrimaryLight,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: Dimensions.spacingSm),
        
        Container(
          padding: const EdgeInsets.all(Dimensions.paddingMd),
          decoration: BoxDecoration(
            color: AppColors.grey50,
            borderRadius: BorderRadius.circular(Dimensions.radiusMd),
            border: Border.all(color: AppColors.borderLight),
          ),
          child: Column(
            children: [
              _buildDetailRow('Category', widget.product.category),
              const Divider(),
              _buildDetailRow('Stock Quantity', '${widget.product.stockQuantity} units'),
              const Divider(),
              _buildDetailRow('Created', _formatDate(widget.product.createdAt)),
              const Divider(),
              _buildDetailRow('Last Updated', _formatDate(widget.product.updatedAt)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondaryLight,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          const SizedBox(width: Dimensions.spacingMd),
          Expanded(
            child: Text(
              value,
              style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textPrimaryLight,
                fontWeight: FontWeight.w400,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  // Hidden for now - Share and Wishlist functionality not implemented
  // void _shareProduct() {
  //   // Implement share functionality
  //   debugPrint('Sharing product: ${widget.product.name}');
  // }

  // void _toggleWishlist() {
  //   // Implement wishlist functionality
  //   debugPrint('Toggle wishlist for: ${widget.product.name}');
  // }
}