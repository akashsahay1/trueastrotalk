import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/cart.dart';
import '../models/product.dart';
import 'local/local_storage_service.dart';
import 'api/cart_api_service.dart';
import 'api/products_api_service.dart';
import 'auth/auth_service.dart';
import 'service_locator.dart';

class CartService extends ChangeNotifier {
  final LocalStorageService _localStorage;
  final CartApiService _cartApiService;
  final ProductsApiService _productsApiService;
  static const String _cartKey = 'shopping_cart';
  
  Cart _cart = Cart.empty();
  bool _isLoading = false;
  String? _error;
  
  CartService(this._localStorage, this._cartApiService, this._productsApiService);
  
  // Initialize cart - call this after LocalStorageService is initialized
  Future<void> initialize() async {
    await _loadCart();
  }

  // Getters
  Cart get cart => _cart;
  List<CartItem> get items => _cart.items;
  int get totalItems => _cart.totalItems;
  double get totalPrice => _cart.totalPrice;
  String get formattedTotalPrice => _cart.formattedTotalPrice;
  bool get isEmpty => _cart.isEmpty;
  bool get isNotEmpty => _cart.isNotEmpty;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Load cart from API or local storage
  Future<void> _loadCart() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Get current user ID (you should get this from your auth service)
      final userId = _getUserId();
      
      if (userId != null) {
        // Try to load from API first
        final result = await _cartApiService.getCart(userId);
        
        if (result['success']) {
          debugPrint('🛒 API getCart result: $result');
          final cartItemsData = result['cart_items'];
          debugPrint('🛒 Raw cart_items from API: $cartItemsData (type: ${cartItemsData.runtimeType})');
          
          List<CartItem> cartItems = [];
          if (cartItemsData != null && cartItemsData is List) {
            // Check if items are already CartItem objects or raw JSON
            debugPrint('🛒 Checking first item type: ${cartItemsData.first.runtimeType}');
            debugPrint('🛒 First item is CartItem: ${cartItemsData.first is CartItem}');
            
            if (cartItemsData.isNotEmpty && cartItemsData.first is CartItem) {
              // Items are already parsed CartItem objects
              cartItems = cartItemsData.cast<CartItem>();
              debugPrint('🛒 Using already parsed ${cartItems.length} cart items from API');
              
              // Check if any items are missing image data and enrich if needed
              debugPrint('🛒 Checking items for image enrichment:');
              for (int i = 0; i < cartItems.length; i++) {
                final item = cartItems[i];
                debugPrint('🛒   Pre-check Item ${i + 1}: ${item.productName} -> productImage: "${item.productImage}" (null: ${item.productImage == null}, empty: ${item.productImage?.isEmpty ?? false})');
              }
              
              final itemsNeedingEnrichment = cartItems.where((item) => 
                item.productImage == null || (item.productImage != null && item.productImage!.isEmpty)).toList();
              
              if (itemsNeedingEnrichment.isNotEmpty) {
                debugPrint('🛒 Found ${itemsNeedingEnrichment.length} items needing image enrichment');
                cartItems = await _enrichCartItemsWithProductData(cartItems);
                debugPrint('🛒 After enrichment, verifying images:');
                for (int i = 0; i < cartItems.length; i++) {
                  final item = cartItems[i];
                  debugPrint('🛒   Item ${i + 1}: ${item.productName} -> ${item.productImage ?? "NO IMAGE"}');
                }
              } else {
                debugPrint('🛒 No items need image enrichment');
              }
            } else {
              // Items are raw JSON, need to parse them
              debugPrint('🛒 Attempting to parse ${cartItemsData.length} items from raw JSON');
              for (int i = 0; i < cartItemsData.length; i++) {
                debugPrint('🛒 Item $i type: ${cartItemsData[i].runtimeType}');
                debugPrint('🛒 Item $i data: ${cartItemsData[i]}');
              }
              cartItems = cartItemsData.map((item) => CartItem.fromApiJson(item)).toList();
              debugPrint('🛒 Successfully parsed ${cartItems.length} cart items from raw JSON');
              
              // Enrich cart items with missing product data
              cartItems = await _enrichCartItemsWithProductData(cartItems);
            }
          } else {
            debugPrint('🛒 No cart items found in API response');
          }
          
          _cart = Cart(items: cartItems);
          await _saveCartToLocal(); // Cache locally
        } else {
          // Fallback to local storage
          await _loadCartFromLocal();
          _error = result['error'];
        }
      } else {
        // User not logged in, use local storage
        await _loadCartFromLocal();
      }
    } catch (e) {
      debugPrint('Error loading cart: $e');
      debugPrint('Stack trace: ${StackTrace.current}');
      await _loadCartFromLocal();
      _error = 'Failed to load cart';
    }

    _isLoading = false;
    notifyListeners();
  }

  // Load cart from local storage (fallback)
  Future<void> _loadCartFromLocal() async {
    try {
      final cartJson = _localStorage.getString(_cartKey);
      if (cartJson != null && cartJson.isNotEmpty) {
        final List<dynamic> cartData = jsonDecode(cartJson);
        _cart = Cart.fromJson(cartData);
      } else {
        _cart = Cart.empty();
      }
    } catch (e) {
      debugPrint('Error loading cart from local storage: $e');
      _cart = Cart.empty();
    }
  }

  // Get current user ID from AuthService
  String? _getUserId() {
    try {
      final authService = getIt<AuthService>();
      final userId = authService.currentUser?.id;
      debugPrint('🛒 Getting user ID from AuthService: $userId');
      return userId;
    } catch (e) {
      debugPrint('🛒 Error getting user ID from AuthService: $e');
      // Fallback to localStorage
      return _localStorage.getString('user_id');
    }
  }

  // Save cart to local storage (for caching)
  Future<void> _saveCartToLocal() async {
    try {
      final cartJson = jsonEncode(_cart.toJson());
      await _localStorage.saveString(_cartKey, cartJson);
    } catch (e) {
      debugPrint('Error saving cart to local storage: $e');
    }
  }

  // Add product to cart
  Future<bool> addToCart(Product product, int quantity) async {
    debugPrint('🛒 Adding to cart: ${product.name}, quantity: $quantity, inStock: ${product.isInStock}');
    if (quantity <= 0 || !product.isInStock) return false;

    _error = null;
    final userId = _getUserId();
    debugPrint('🛒 User ID: $userId');

    if (userId != null) {
      // Add to API cart
      try {
        final result = await _cartApiService.addToCart(
          userId: userId,
          productId: product.id,
          quantity: quantity,
        );

        if (result['success']) {
          // Reload cart from API to get updated data
          debugPrint('🛒 API success, reloading cart...');
          await _loadCart();
          
          // Debug: Check if the added item has image
          final addedItem = _cart.getItem(product.id);
          debugPrint('✅ Added ${product.name} (qty: $quantity) to cart via API');
          debugPrint('🛒 Added item image URL: ${addedItem?.productImage}');
          debugPrint('🛒 Original product image URL: ${product.fixedImageUrl}');
          debugPrint('🛒 After reload: Cart has ${_cart.items.length} items, total: ${_cart.totalItems}');
          return true;
        } else {
          _error = result['error'];
          debugPrint('🛒 API failed, using local cart. Error: ${result['error']}');
          // Fallback to local cart
          final cartItem = CartItem.fromProduct(product, quantity);
          debugPrint('🛒 Created cart item: ${cartItem.productName}, quantity: ${cartItem.quantity}');
          _cart.addItem(cartItem);
          debugPrint('🛒 Cart now has ${_cart.items.length} items, total: ${_cart.totalItems}');
          await _saveCartToLocal();
          notifyListeners();
          debugPrint('✅ Added ${product.name} (qty: $quantity) to local cart');
          return true;
        }
      } catch (e) {
        debugPrint('Error adding to cart via API: $e');
        _error = 'Failed to add item to cart';
        // Fallback to local cart
        final cartItem = CartItem.fromProduct(product, quantity);
        debugPrint('🛒 Exception fallback - Created cart item: ${cartItem.productName}');
        _cart.addItem(cartItem);
        debugPrint('🛒 Exception fallback - Cart now has ${_cart.items.length} items');
        await _saveCartToLocal();
        notifyListeners();
        return true;
      }
    } else {
      // User not logged in, use local cart
      debugPrint('🛒 User not logged in, using local cart');
      final cartItem = CartItem.fromProduct(product, quantity);
      debugPrint('🛒 No user - Created cart item: ${cartItem.productName}');
      _cart.addItem(cartItem);
      debugPrint('🛒 No user - Cart now has ${_cart.items.length} items');
      await _saveCartToLocal();
      notifyListeners();
      debugPrint('✅ Added ${product.name} (qty: $quantity) to local cart');
      return true;
    }
  }

  // Remove item from cart
  Future<bool> removeFromCart(String productId) async {
    _error = null;
    final userId = _getUserId();

    if (userId != null) {
      // Find cart item to get cart_item_id
      final cartItem = _cart.getItem(productId);
      if (cartItem == null) return false;

      try {
        final result = await _cartApiService.removeFromCart(
          cartItemId: productId, // Assuming productId is used as cartItemId locally
          userId: userId,
        );

        if (result['success']) {
          _cart.removeItem(productId);
          await _saveCartToLocal();
          notifyListeners();
          debugPrint('🗑️ Removed item $productId from cart via API');
          return true;
        } else {
          _error = result['error'];
          // Fallback to local removal
          _cart.removeItem(productId);
          await _saveCartToLocal();
          notifyListeners();
          return true;
        }
      } catch (e) {
        debugPrint('Error removing from cart via API: $e');
        _error = 'Failed to remove item from cart';
        // Fallback to local removal
        _cart.removeItem(productId);
        await _saveCartToLocal();
        notifyListeners();
        return true;
      }
    } else {
      // User not logged in, use local cart
      _cart.removeItem(productId);
      await _saveCartToLocal();
      notifyListeners();
      debugPrint('🗑️ Removed item $productId from local cart');
      return true;
    }
  }

  // Update item quantity
  Future<bool> updateQuantity(String productId, int quantity) async {
    if (quantity < 0) return false;
    
    if (quantity == 0) {
      return await removeFromCart(productId);
    }

    _error = null;
    final userId = _getUserId();

    if (userId != null) {
      // Find cart item to get cart_item_id
      final cartItem = _cart.getItem(productId);
      if (cartItem == null) return false;

      try {
        final result = await _cartApiService.updateCartItem(
          cartItemId: productId, // Assuming productId is used as cartItemId locally
          userId: userId,
          quantity: quantity,
        );

        if (result['success']) {
          _cart.updateQuantity(productId, quantity);
          await _saveCartToLocal();
          notifyListeners();
          debugPrint('🔄 Updated item $productId quantity to $quantity via API');
          return true;
        } else {
          _error = result['error'];
          // Fallback to local update
          _cart.updateQuantity(productId, quantity);
          await _saveCartToLocal();
          notifyListeners();
          return true;
        }
      } catch (e) {
        debugPrint('Error updating cart via API: $e');
        _error = 'Failed to update cart item';
        // Fallback to local update
        _cart.updateQuantity(productId, quantity);
        await _saveCartToLocal();
        notifyListeners();
        return true;
      }
    } else {
      // User not logged in, use local cart
      _cart.updateQuantity(productId, quantity);
      await _saveCartToLocal();
      notifyListeners();
      debugPrint('🔄 Updated item $productId quantity to $quantity in local cart');
      return true;
    }
  }

  // Increment item quantity
  Future<bool> incrementQuantity(String productId, {int amount = 1}) async {
    final item = _cart.getItem(productId);
    if (item != null) {
      return await updateQuantity(productId, item.quantity + amount);
    }
    return false;
  }

  // Decrement item quantity
  Future<bool> decrementQuantity(String productId, {int amount = 1}) async {
    final item = _cart.getItem(productId);
    if (item != null) {
      return await updateQuantity(productId, item.quantity - amount);
    }
    return false;
  }

  // Clear entire cart
  Future<bool> clearCart() async {
    _error = null;
    final userId = _getUserId();

    if (userId != null) {
      try {
        final result = await _cartApiService.clearCart(userId);
        
        if (result['success']) {
          _cart.clear();
          await _saveCartToLocal();
          notifyListeners();
          debugPrint('🧹 Cart cleared via API');
          return true;
        } else {
          _error = result['error'];
          // Fallback to local clear
          _cart.clear();
          await _saveCartToLocal();
          notifyListeners();
          return true;
        }
      } catch (e) {
        debugPrint('Error clearing cart via API: $e');
        _error = 'Failed to clear cart';
        // Fallback to local clear
        _cart.clear();
        await _saveCartToLocal();
        notifyListeners();
        return true;
      }
    } else {
      // User not logged in, use local cart
      _cart.clear();
      await _saveCartToLocal();
      notifyListeners();
      debugPrint('🧹 Local cart cleared');
      return true;
    }
  }

  // Check if product is in cart
  bool hasProduct(String productId) {
    return _cart.hasItem(productId);
  }

  // Get item quantity
  int getQuantity(String productId) {
    final item = _cart.getItem(productId);
    return item?.quantity ?? 0;
  }

  // Get cart item
  CartItem? getItem(String productId) {
    return _cart.getItem(productId);
  }

  // Calculate shipping cost (can be customized based on location, weight, etc.)
  double calculateShipping() {
    if (isEmpty) return 0.0;
    if (totalPrice >= 500) return 0.0; // Free shipping above ₹500
    return 50.0; // ₹50 shipping fee
  }

  // Calculate tax (can be customized based on location, product type, etc.)
  double calculateTax() {
    return totalPrice * 0.18; // 18% GST
  }

  // Calculate final total including shipping and tax
  double getFinalTotal() {
    return totalPrice + calculateShipping() + calculateTax();
  }

  String getFormattedFinalTotal() {
    return '₹${getFinalTotal().toStringAsFixed(0)}';
  }

  // Get cart summary for checkout
  Map<String, dynamic> getCartSummary() {
    return {
      'subtotal': totalPrice,
      'shipping': calculateShipping(),
      'tax': calculateTax(),
      'total': getFinalTotal(),
      'total_items': totalItems,
      'formatted_subtotal': formattedTotalPrice,
      'formatted_shipping': '₹${calculateShipping().toStringAsFixed(0)}',
      'formatted_tax': '₹${calculateTax().toStringAsFixed(0)}',
      'formatted_total': getFormattedFinalTotal(),
    };
  }

  // Validate cart before checkout
  Map<String, dynamic> validateCart() {
    final errors = <String>[];
    
    if (isEmpty) {
      errors.add('Cart is empty');
    }
    
    for (final item in items) {
      // Here you might want to validate against actual product stock
      // For now, we'll just check basic conditions
      if (item.quantity <= 0) {
        errors.add('Invalid quantity for ${item.productName}');
      }
      
      if (item.productPrice <= 0) {
        errors.add('Invalid price for ${item.productName}');
      }
    }
    
    return {
      'is_valid': errors.isEmpty,
      'errors': errors,
    };
  }

  // Refresh cart (useful for syncing with server if needed)
  Future<void> refreshCart() async {
    await _loadCart();
  }

  // Sync local cart with server (when user logs in)
  Future<bool> syncCartWithServer() async {
    final userId = _getUserId();
    if (userId == null || _cart.isEmpty) return true;

    try {
      // Upload local cart items to server
      for (final item in _cart.items) {
        await _cartApiService.addToCart(
          userId: userId,
          productId: item.productId,
          quantity: item.quantity,
        );
      }

      // Reload cart from server
      await _loadCart();
      debugPrint('✅ Cart synced with server');
      return true;
    } catch (e) {
      debugPrint('Error syncing cart with server: $e');
      _error = 'Failed to sync cart with server';
      return false;
    }
  }

  // Enrich cart items with missing product data (especially images)
  Future<List<CartItem>> _enrichCartItemsWithProductData(List<CartItem> cartItems) async {
    final enrichedItems = <CartItem>[];
    
    for (final item in cartItems) {
      // If cart item already has image data, keep it as is
      if (item.productImage != null && item.productImage!.isNotEmpty) {
        enrichedItems.add(item);
        continue;
      }
      
      debugPrint('🛒 Enriching cart item ${item.productName} (ID: ${item.productId}) with product data');
      
      try {
        // Fetch full product details
        final result = await _productsApiService.getProduct(item.productId);
        
        if (result['success'] && result['product'] != null) {
          final Product product = result['product'];
          
          // Create enriched cart item with product image
          final enrichedItem = item.copyWith(
            productImage: product.fixedImageUrl,
          );
          
          debugPrint('🛒 ✅ Enriched ${item.productName} with image: ${product.fixedImageUrl}');
          enrichedItems.add(enrichedItem);
        } else {
          debugPrint('🛒 ❌ Failed to fetch product data for ${item.productId}: ${result['error']}');
          enrichedItems.add(item); // Keep original item
        }
      } catch (e) {
        debugPrint('🛒 ❌ Error enriching cart item ${item.productId}: $e');
        enrichedItems.add(item); // Keep original item
      }
    }
    
    return enrichedItems;
  }
}