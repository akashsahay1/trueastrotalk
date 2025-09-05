import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../common/widgets/product_card.dart';
import '../services/api/products_api_service.dart';
import '../services/service_locator.dart';
import '../services/cart_service.dart';
import '../models/product.dart';
import 'product_details.dart';
import 'cart.dart';

class ProductsListScreen extends StatefulWidget {
  const ProductsListScreen({super.key});

  @override
  State<ProductsListScreen> createState() => _ProductsListScreenState();
}

class _ProductsListScreenState extends State<ProductsListScreen> {
  late final ProductsApiService _productsApiService;
  late final CartService _cartService;
  
  List<Product> _products = [];
  List<Product> _filteredProducts = [];
  bool _isLoading = true;
  String _selectedCategory = 'All';
  bool _isGridView = true;
  String _sortBy = 'default';
  
  final TextEditingController _searchController = TextEditingController();
  final List<String> _categories = ['All', 'Gemstones', 'Jewelry', 'Books', 'Spiritual Items', 'Puja Items'];
  final Map<String, String> _sortOptions = {
    'default': 'Relevance',
    'name_asc': 'Name (A-Z)',
    'name_desc': 'Name (Z-A)',
    'price_asc': 'Price (Low to High)',
    'price_desc': 'Price (High to Low)',
  };

  @override
  void initState() {
    super.initState();
    _productsApiService = getIt<ProductsApiService>();
    _cartService = getIt<CartService>();
    _cartService.addListener(_onCartChanged);
    _loadProducts();
  }

  @override
  void dispose() {
    _cartService.removeListener(_onCartChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onCartChanged() {
    if (mounted) {
      setState(() {}); // Rebuild to update cart icon badge
    }
  }

  Future<void> _loadProducts() async {
    try {
      setState(() {
        _isLoading = true;
      });

      final result = await _productsApiService.getProducts();
      
      if (!result['success']) {
        throw Exception(result['error']);
      }
      
      final products = result['products'] as List<Product>;
      
      setState(() {
        _products = products;
        _filteredProducts = products;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('❌ Error loading products: $e');
      setState(() {
        _isLoading = false;
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load products: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _filterProducts() {
    setState(() {
      _filteredProducts = _products.where((product) {
        final matchesSearch = _searchController.text.isEmpty || 
            product.name.toLowerCase().contains(_searchController.text.toLowerCase()) ||
            product.description.toLowerCase().contains(_searchController.text.toLowerCase());
            
        final matchesCategory = _selectedCategory == 'All' || 
            product.category.toLowerCase() == _selectedCategory.toLowerCase();
            
        return matchesSearch && matchesCategory;
      }).toList();
      
      // Apply sorting
      _sortProducts();
    });
  }
  
  void _sortProducts() {
    switch (_sortBy) {
      case 'name_asc':
        _filteredProducts.sort((a, b) => a.name.compareTo(b.name));
        break;
      case 'name_desc':
        _filteredProducts.sort((a, b) => b.name.compareTo(a.name));
        break;
      case 'price_asc':
        _filteredProducts.sort((a, b) => a.price.compareTo(b.price));
        break;
      case 'price_desc':
        _filteredProducts.sort((a, b) => b.price.compareTo(a.price));
        break;
      default:
        // Keep default order
        break;
    }
  }

  void _onCategorySelected(String category) {
    setState(() {
      _selectedCategory = category;
    });
    _filterProducts();
  }

  void _navigateToProductDetails(Product product) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProductDetailsScreen(product: product),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 243, 245, 249),
      appBar: AppBar(
        title: Text('Products', style: AppTextStyles.heading4.copyWith(color: AppColors.white)),
        backgroundColor: AppColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: Icon(_isGridView ? Icons.view_list : Icons.grid_view, color: AppColors.white),
            onPressed: () {
              setState(() {
                _isGridView = !_isGridView;
              });
            },
          ),
          // Cart icon with badge
          GestureDetector(
            onTap: () {
              debugPrint('🛒 Cart area tapped - navigating to cart');
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const CartScreen()),
              );
            },
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                IconButton(
                  icon: const Icon(Icons.shopping_cart_outlined, color: AppColors.white),
                  onPressed: () {
                    debugPrint('🛒 Cart icon button tapped - navigating to cart');
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const CartScreen()),
                    );
                  },
                ),
                if (_cartService.totalItems > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: IgnorePointer(
                      child: Container(
                        width: 18,
                        height: 18,
                        decoration: BoxDecoration(
                          color: AppColors.error,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${_cartService.totalItems}',
                            style: const TextStyle(
                              color: AppColors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: Dimensions.paddingLg,
              vertical: Dimensions.paddingMd,
            ),
            color: AppColors.white,
            child: TextField(
              controller: _searchController,
              onChanged: (_) => _filterProducts(),
              decoration: InputDecoration(
                hintText: 'Search products...',
                prefixIcon: const Icon(Icons.search, color: AppColors.grey400),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: AppColors.grey400),
                        onPressed: () {
                          _searchController.clear();
                          _filterProducts();
                        },
                      )
                    : null,
                filled: true,
                fillColor: AppColors.grey100,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusMd),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: Dimensions.paddingMd,
                  vertical: Dimensions.paddingMd,
                ),
              ),
            ),
          ),

          // Sort and Category Filter Row
          Container(
            height: 50,
            color: AppColors.white,
            child: Row(
              children: [
                // Sort Dropdown
                Container(
                  padding: const EdgeInsets.only(left: Dimensions.paddingLg),
                  child: DropdownButton<String>(
                    value: _sortBy,
                    underline: Container(),
                    icon: const Icon(Icons.arrow_drop_down, color: AppColors.grey600, size: 24),
                    style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey600),
                    onChanged: (String? value) {
                      if (value != null) {
                        setState(() {
                          _sortBy = value;
                          _sortProducts();
                        });
                      }
                    },
                    items: _sortOptions.entries.map((entry) {
                      return DropdownMenuItem<String>(
                        value: entry.key,
                        child: Text(
                          entry.value,
                          style: AppTextStyles.bodySmall.copyWith(
                            color: _sortBy == entry.key ? AppColors.primary : AppColors.grey600,
                            fontWeight: _sortBy == entry.key ? FontWeight.w600 : FontWeight.normal,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
                const SizedBox(width: Dimensions.spacingMd),
                Container(
                  width: 1,
                  height: 30,
                  color: AppColors.borderLight,
                ),
                const SizedBox(width: Dimensions.spacingMd),
                // Category Filter
                Expanded(
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: Dimensions.paddingSm),
                    itemCount: _categories.length,
                    separatorBuilder: (context, index) => const SizedBox(width: Dimensions.spacingSm),
                    itemBuilder: (context, index) {
                final category = _categories[index];
                final isSelected = _selectedCategory == category;
                
                return FilterChip(
                  label: Text(category),
                  selected: isSelected,
                  onSelected: (_) => _onCategorySelected(category),
                  backgroundColor: AppColors.grey100,
                  selectedColor: AppColors.primary.withValues(alpha: 0.2),
                  checkmarkColor: AppColors.primary,
                  labelStyle: TextStyle(
                    color: isSelected ? AppColors.primary : AppColors.grey600,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
                );
                    },
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1, color: AppColors.borderLight),

          // Products List/Grid
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredProducts.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadProducts,
                        color: AppColors.primary,
                        child: _isGridView ? _buildGridView() : _buildListView(),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.shopping_bag_outlined, size: 64, color: AppColors.grey400),
          const SizedBox(height: Dimensions.spacingMd),
          Text(
            'No products found',
            style: AppTextStyles.heading5.copyWith(color: AppColors.grey600),
          ),
          const SizedBox(height: Dimensions.spacingSm),
          Text(
            'Try adjusting your search or filters',
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey400),
          ),
        ],
      ),
    );
  }

  Widget _buildGridView() {
    return GridView.builder(
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: Dimensions.spacingMd,
        mainAxisSpacing: Dimensions.spacingMd,
        childAspectRatio: 0.65,
      ),
      itemCount: _filteredProducts.length,
      itemBuilder: (context, index) => ProductCard(
        product: _filteredProducts[index],
        onTap: () => _navigateToProductDetails(_filteredProducts[index]),
        isGridView: true,
      ),
    );
  }

  Widget _buildListView() {
    return ListView.separated(
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      itemCount: _filteredProducts.length,
      separatorBuilder: (context, index) => const SizedBox(height: Dimensions.spacingMd),
      itemBuilder: (context, index) => ProductCard(
        product: _filteredProducts[index],
        onTap: () => _navigateToProductDetails(_filteredProducts[index]),
        isGridView: false,
      ),
    );
  }

}