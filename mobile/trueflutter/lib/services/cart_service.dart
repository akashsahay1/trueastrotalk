import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../models/cart.dart';
import '../models/product.dart';
import 'local/local_storage_service.dart';

class CartService extends ChangeNotifier {
  final LocalStorageService _localStorage;
  static const String _cartKey = 'shopping_cart';
  
  Cart _cart = Cart.empty();
  
  CartService(this._localStorage) {
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

  // Load cart from storage
  Future<void> _loadCart() async {
    try {
      final cartJson = _localStorage.getString(_cartKey);
      if (cartJson != null && cartJson.isNotEmpty) {
        final List<dynamic> cartData = jsonDecode(cartJson);
        _cart = Cart.fromJson(cartData);
      } else {
        _cart = Cart.empty();
      }
    } catch (e) {
      debugPrint('Error loading cart: $e');
      _cart = Cart.empty();
    }
    notifyListeners();
  }

  // Save cart to storage
  Future<void> _saveCart() async {
    try {
      final cartJson = jsonEncode(_cart.toJson());
      await _localStorage.saveString(_cartKey, cartJson);
    } catch (e) {
      debugPrint('Error saving cart: $e');
    }
  }

  // Add product to cart
  Future<void> addToCart(Product product, int quantity) async {
    if (quantity <= 0 || !product.isInStock) return;

    final cartItem = CartItem.fromProduct(product, quantity);
    _cart.addItem(cartItem);
    
    await _saveCart();
    notifyListeners();
    
    debugPrint('✅ Added ${product.name} (qty: $quantity) to cart');
  }

  // Remove item from cart
  Future<void> removeFromCart(String productId) async {
    _cart.removeItem(productId);
    
    await _saveCart();
    notifyListeners();
    
    debugPrint('🗑️ Removed item $productId from cart');
  }

  // Update item quantity
  Future<void> updateQuantity(String productId, int quantity) async {
    if (quantity < 0) return;
    
    if (quantity == 0) {
      await removeFromCart(productId);
      return;
    }

    _cart.updateQuantity(productId, quantity);
    
    await _saveCart();
    notifyListeners();
    
    debugPrint('🔄 Updated item $productId quantity to $quantity');
  }

  // Increment item quantity
  Future<void> incrementQuantity(String productId, {int amount = 1}) async {
    final item = _cart.getItem(productId);
    if (item != null) {
      await updateQuantity(productId, item.quantity + amount);
    }
  }

  // Decrement item quantity
  Future<void> decrementQuantity(String productId, {int amount = 1}) async {
    final item = _cart.getItem(productId);
    if (item != null) {
      await updateQuantity(productId, item.quantity - amount);
    }
  }

  // Clear entire cart
  Future<void> clearCart() async {
    _cart.clear();
    
    await _saveCart();
    notifyListeners();
    
    debugPrint('🧹 Cart cleared');
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
}