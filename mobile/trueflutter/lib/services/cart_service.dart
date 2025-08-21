import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/cart.dart';
import '../models/product.dart';
import 'local/local_storage_service.dart';
import 'api/cart_api_service.dart';

class CartService extends ChangeNotifier {
  final LocalStorageService _localStorage;
  final CartApiService _cartApiService;
  static const String _cartKey = 'shopping_cart';
  
  Cart _cart = Cart.empty();
  bool _isLoading = false;
  String? _error;
  
  CartService(this._localStorage, this._cartApiService) {
    _loadCart();
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
          final List<CartItem> cartItems = result['cart_items'];
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

  // Get current user ID (replace with actual auth service call)
  String? _getUserId() {
    // Replace with actual auth service integration
    // For now returning stored user ID or mock fallback
    return _localStorage.getString('user_id') ?? '507f1f77bcf86cd799439011';
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
    if (quantity <= 0 || !product.isInStock) return false;

    _error = null;
    final userId = _getUserId();

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
          await _loadCart();
          debugPrint('✅ Added ${product.name} (qty: $quantity) to cart via API');
          return true;
        } else {
          _error = result['error'];
          // Fallback to local cart
          final cartItem = CartItem.fromProduct(product, quantity);
          _cart.addItem(cartItem);
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
        _cart.addItem(cartItem);
        await _saveCartToLocal();
        notifyListeners();
        return true;
      }
    } else {
      // User not logged in, use local cart
      final cartItem = CartItem.fromProduct(product, quantity);
      _cart.addItem(cartItem);
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
}