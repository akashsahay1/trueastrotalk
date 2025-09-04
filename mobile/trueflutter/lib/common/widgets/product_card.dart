import 'package:flutter/material.dart';
import '../themes/app_colors.dart';
import '../themes/text_styles.dart';
import '../constants/dimensions.dart';
import '../../models/product.dart';
import '../../services/cart_service.dart';
import '../../services/service_locator.dart';

class ProductCard extends StatefulWidget {
  final Product product;
  final VoidCallback? onTap;
  final bool isGridView;
  final bool isHorizontalScroll;

  const ProductCard({super.key, required this.product, this.onTap, this.isGridView = true, this.isHorizontalScroll = false});

  @override
  State<ProductCard> createState() => _ProductCardState();
}

class _ProductCardState extends State<ProductCard> {
  late final CartService _cartService;
  bool _showQuantityControls = false;
  bool _isUpdating = false;

  @override
  void initState() {
    super.initState();
    _cartService = getIt<CartService>();
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

  Future<void> _addToCart() async {
    // Prevent adding more than 99 items or multiple rapid taps
    if (_cartQuantity >= 99 || _isUpdating) return;

    // Show quantity controls immediately when Add to Cart is tapped
    if (_cartQuantity == 0 && !_showQuantityControls) {
      setState(() {
        _showQuantityControls = true;
      });
    }

    setState(() {
      _isUpdating = true;
    });

    try {
      await _cartService.addToCart(widget.product, 1);
    } catch (e) {
      // If API fails and item wasn't in cart, hide quantity controls
      if (_cartQuantity == 0 && mounted) {
        setState(() {
          _showQuantityControls = false;
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUpdating = false;
        });
      }
    }
  }

  Future<void> _removeFromCart() async {
    try {
      await _cartService.decrementQuantity(widget.product.id);
      // Hide quantity controls when cart becomes empty - check after API call
      if (mounted && _cartService.getQuantity(widget.product.id) == 0) {
        setState(() {
          _showQuantityControls = false;
        });
      }
    } catch (e) {
      // Silent error handling - cart badge will reflect the actual state
      debugPrint('Error updating cart: $e');
    }
  }

  int get _cartQuantity => _cartService.getQuantity(widget.product.id);

  Widget _buildProductImage() {
    if (widget.product.fixedImageUrl?.isNotEmpty == true) {
      return Image.network(
        widget.product.fixedImageUrl!,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          debugPrint('❌ Failed to load product image: $error');
          return _buildPlaceholderImage();
        },
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Center(child: CircularProgressIndicator(value: loadingProgress.expectedTotalBytes != null ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes! : null, strokeWidth: 2));
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
      child: const Icon(Icons.image, size: 40, color: AppColors.grey400),
    );
  }

  Widget _buildCartControls() {
    return SizedBox(
      height: 36, // Fixed height to prevent layout changes
      child: _cartQuantity > 0 || _showQuantityControls ? _buildQuantityControls() : _buildAddToCartButton(),
    );
  }

  Widget _buildQuantityControls() {
    // Get the actual quantity to display (use 1 as minimum when showing controls)
    final displayQuantity = _cartQuantity > 0 ? _cartQuantity : 1;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Minus button - Square
        Container(
          width: 36,
          height: 36, // Equal height and width
          decoration: BoxDecoration(
            color: AppColors.white,
            border: Border.all(color: AppColors.primary, width: 1),
            borderRadius: BorderRadius.circular(Dimensions.radiusSm),
          ),
          child: InkWell(
            onTap: _removeFromCart,
            borderRadius: BorderRadius.circular(Dimensions.radiusSm),
            child: const Icon(Icons.remove, color: AppColors.primary, size: 16),
          ),
        ),
        const SizedBox(width: 8),
        // Quantity display - Fixed width for 2 digits
        Container(
          width: 45, // Fixed width for 2 digits
          height: 36, // Match button height
          padding: const EdgeInsets.symmetric(horizontal: 6),
          decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(Dimensions.radiusSm)),
          child: Center(
            child: Text(
              displayQuantity.toString().padLeft(2, '0'), // Always show 2 digits
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.white, fontWeight: FontWeight.w600),
            ),
          ),
        ),
        const SizedBox(width: 8),
        // Plus button - Square
        Container(
          width: 36,
          height: 36, // Equal height and width
          decoration: BoxDecoration(
            color: _cartQuantity < 99 ? AppColors.white : AppColors.grey100,
            border: Border.all(color: _cartQuantity < 99 ? AppColors.primary : AppColors.grey300, width: 1),
            borderRadius: BorderRadius.circular(Dimensions.radiusSm),
          ),
          child: InkWell(
            onTap: _cartQuantity < 99 ? _addToCart : null, // Cap at 99
            borderRadius: BorderRadius.circular(Dimensions.radiusSm),
            child: Icon(Icons.add, color: _cartQuantity < 99 ? AppColors.primary : AppColors.grey400, size: 16),
          ),
        ),
      ],
    );
  }

  Widget _buildAddToCartButton() {
    return Center(
      child: OutlinedButton(
        onPressed: (widget.product.isInStock && !_isUpdating) ? _addToCart : null,
        style: OutlinedButton.styleFrom(
          foregroundColor: widget.product.isInStock ? AppColors.primary : AppColors.grey400,
          side: BorderSide(color: widget.product.isInStock ? AppColors.primary : AppColors.grey300, width: 1),
          padding: const EdgeInsets.only(left: 20, right: 20, top: 5, bottom: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusSm)),
          minimumSize: Size(double.infinity, 36),
        ),
        child: _isUpdating ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : Text(widget.product.isInStock ? 'Add to Cart' : 'Out of Stock', style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isGridView) {
      return _buildGridCard();
    } else {
      return _buildListCard();
    }
  }

  Widget _buildGridCard() {
    if (widget.isHorizontalScroll) {
      // For horizontal scroll (home page) - use fixed proportions
      return Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image
            Expanded(
              flex: 3,
              child: InkWell(
                onTap: widget.onTap,
                borderRadius: const BorderRadius.only(topLeft: Radius.circular(Dimensions.radiusMd), topRight: Radius.circular(Dimensions.radiusMd)),
                child: ClipRRect(
                  borderRadius: const BorderRadius.only(topLeft: Radius.circular(Dimensions.radiusMd), topRight: Radius.circular(Dimensions.radiusMd)),
                  child: Container(width: double.infinity, color: AppColors.grey100, child: _buildProductImage()),
                ),
              ),
            ),

            // Product Details - Improved layout
            Padding(
              padding: const EdgeInsets.all(Dimensions.paddingSm),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Product Name - Tappable
                  InkWell(
                    onTap: widget.onTap,
                    child: Text(
                      widget.product.name,
                      style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600, color: AppColors.textPrimaryLight),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 15),

                  // Price and Stock Status Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Price
                      Text(
                        widget.product.formattedPrice,
                        style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                      // Stock Status
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(color: widget.product.isInStock ? AppColors.success : AppColors.error, borderRadius: BorderRadius.circular(4)),
                        child: Text(widget.product.stockText, style: AppTextStyles.overline.copyWith(color: AppColors.white, fontSize: 10)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 15),

                  // Add to Cart Button - Centered
                  _buildCartControls(),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // For grid view (products page) - use proportional height
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product Image - Proportional height
          Expanded(
            flex: 4,
            child: InkWell(
              onTap: widget.onTap,
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(Dimensions.radiusMd), topRight: Radius.circular(Dimensions.radiusMd)),
              child: ClipRRect(
                borderRadius: const BorderRadius.only(topLeft: Radius.circular(Dimensions.radiusMd), topRight: Radius.circular(Dimensions.radiusMd)),
                child: Container(width: double.infinity, color: AppColors.grey100, child: _buildProductImage()),
              ),
            ),
          ),

          // Product Details - Improved layout
          Padding(
            padding: const EdgeInsets.all(Dimensions.paddingSm),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Product Name - Tappable
                InkWell(
                  onTap: widget.onTap,
                  child: Text(
                    widget.product.name,
                    style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.w600, color: AppColors.textPrimaryLight),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(height: 15),

                // Price and Stock Status Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Price
                    Text(
                      widget.product.formattedPrice,
                      style: AppTextStyles.bodyMedium.copyWith(fontWeight: FontWeight.bold, color: AppColors.primary),
                    ),
                    // Stock Status
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: widget.product.isInStock ? AppColors.success : AppColors.error, borderRadius: BorderRadius.circular(4)),
                      child: Text(widget.product.stockText, style: AppTextStyles.overline.copyWith(color: AppColors.white, fontSize: 8)),
                    ),
                  ],
                ),
                const SizedBox(height: 15),

                // Add to Cart Button - Centered
                _buildCartControls(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildListCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingMd),
        child: Row(
          children: [
            // Product Image - Tappable
            InkWell(
              onTap: widget.onTap,
              borderRadius: BorderRadius.circular(Dimensions.radiusSm),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                child: Container(width: 80, height: 80, color: AppColors.grey100, child: _buildProductImage()),
              ),
            ),
            const SizedBox(width: Dimensions.spacingMd),

            // Product Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product Name - Tappable
                  InkWell(
                    onTap: widget.onTap,
                    child: Text(
                      widget.product.name,
                      style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600, color: AppColors.textPrimaryLight),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(widget.product.category, style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight)),
                  const SizedBox(height: 4),
                  Text(
                    widget.product.shortDescription,
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.grey600),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 15),

                  // Price and Stock Status Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Price
                      Text(
                        widget.product.formattedPrice,
                        style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.bold, color: AppColors.primary),
                      ),
                      // Stock Status
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: widget.product.isInStock ? AppColors.success : AppColors.error, borderRadius: BorderRadius.circular(4)),
                        child: Text(widget.product.stockText, style: AppTextStyles.overline.copyWith(color: AppColors.white, fontSize: 9)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 15),

                  // Add to Cart Button - Centered
                  _buildCartControls(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
