import 'package:flutter/foundation.dart';
import 'product.dart';

class CartItem {
  final String productId;
  final String productName;
  final double productPrice;
  final String? productImage;
  final String category;
  int quantity;
  final DateTime addedAt;

  CartItem({
    required this.productId,
    required this.productName,
    required this.productPrice,
    this.productImage,
    required this.category,
    required this.quantity,
    required this.addedAt,
  });

  factory CartItem.fromProduct(Product product, int quantity) {
    final imageUrl = product.fixedImageUrl;
    debugPrint('🛒 Creating CartItem for ${product.name}: imageUrl = $imageUrl');
    
    return CartItem(
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productImage: imageUrl,
      category: product.category,
      quantity: quantity,
      addedAt: DateTime.now(),
    );
  }

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      productId: json['product_id'] ?? '',
      productName: json['product_name'] ?? '',
      productPrice: (json['product_price'] as num?)?.toDouble() ?? 0.0,
      productImage: json['product_image'],
      category: json['category'] ?? '',
      quantity: json['quantity'] ?? 1,
      addedAt: DateTime.tryParse(json['added_at'] ?? '') ?? DateTime.now(),
    );
  }

  factory CartItem.fromApiJson(Map<String, dynamic> json) {
    // DEBUG: Print the entire JSON structure to see what the API is actually returning
    debugPrint('🛒 🔍 Full API JSON for cart item: $json');
    
    // If there's no product data in the API response, we might need to use the product ID
    // to fetch the image URL from the product data that should be available elsewhere
    String? imageUrl;
    
    // Check if product data exists in the response
    final productData = json['product'] as Map<String, dynamic>?;
    
    if (productData != null) {
      debugPrint('🛒 🔍 Product data exists, available keys: ${productData.keys.toList()}');
      
      // Try multiple possible image URL paths
      imageUrl = productData['featured_image'];
      
      if (imageUrl == null || imageUrl.isEmpty) {
        imageUrl = productData['image_url'];
      }
      
      if (imageUrl == null || imageUrl.isEmpty) {
        final galleryImages = productData['gallery_images'] as List<dynamic>?;
        if (galleryImages?.isNotEmpty == true) {
          imageUrl = galleryImages!.first.toString();
        }
      }
      
      if (imageUrl == null || imageUrl.isEmpty) {
        final images = productData['images'] as List<dynamic>?;
        if (images?.isNotEmpty == true) {
          imageUrl = images!.first.toString();
        }
      }
    }
    
    // If no product data or no image found, try top-level fields
    if (imageUrl == null || imageUrl.isEmpty) {
      imageUrl = json['product_image'];
    }
    
    // Final fallback - if we still don't have an image, we'll need to handle this gracefully
    if (imageUrl == null || imageUrl.isEmpty) {
      debugPrint('🛒 ⚠️ No image URL found for cart item, product_id: ${json['product_id']}');
      // We could potentially fetch the product data here using the product_id
      // but for now, we'll leave it null and handle it in the UI
    }
    
    debugPrint('🛒 fromApiJson result: ${json['product']?['name'] ?? json['product_name']} -> imageUrl: $imageUrl');
    
    return CartItem(
      productId: json['product_id'] ?? '',
      productName: json['product']?['name'] ?? json['product_name'] ?? '',
      productPrice: (json['product']?['price'] as num?)?.toDouble() ?? 
                   (json['product_price'] as num?)?.toDouble() ?? 0.0,
      productImage: imageUrl,
      category: json['product']?['category'] ?? json['category'] ?? '',
      quantity: json['quantity'] ?? 1,
      addedAt: DateTime.tryParse(json['created_at'] ?? json['added_at'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'product_id': productId,
      'product_name': productName,
      'product_price': productPrice,
      'product_image': productImage,
      'category': category,
      'quantity': quantity,
      'added_at': addedAt.toIso8601String(),
    };
  }

  double get totalPrice => productPrice * quantity;
  String get formattedTotalPrice => '₹${totalPrice.toStringAsFixed(2)}';
  String get formattedUnitPrice => '₹${productPrice.toStringAsFixed(2)}';

  CartItem copyWith({
    String? productId,
    String? productName,
    double? productPrice,
    String? productImage,
    String? category,
    int? quantity,
    DateTime? addedAt,
  }) {
    return CartItem(
      productId: productId ?? this.productId,
      productName: productName ?? this.productName,
      productPrice: productPrice ?? this.productPrice,
      productImage: productImage ?? this.productImage,
      category: category ?? this.category,
      quantity: quantity ?? this.quantity,
      addedAt: addedAt ?? this.addedAt,
    );
  }
}

class Cart {
  final List<CartItem> items;

  Cart({required this.items});

  factory Cart.empty() {
    return Cart(items: []);
  }

  factory Cart.fromJson(List<dynamic> json) {
    return Cart(
      items: json.map((item) => CartItem.fromJson(item)).toList(),
    );
  }

  List<Map<String, dynamic>> toJson() {
    return items.map((item) => item.toJson()).toList();
  }

  // Getters
  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);
  double get totalPrice => items.fold(0, (sum, item) => sum + item.totalPrice);
  String get formattedTotalPrice => '₹${totalPrice.toStringAsFixed(2)}';
  bool get isEmpty => items.isEmpty;
  bool get isNotEmpty => items.isNotEmpty;

  // Methods
  void addItem(CartItem item) {
    final existingIndex = items.indexWhere((i) => i.productId == item.productId);
    
    if (existingIndex >= 0) {
      items[existingIndex] = items[existingIndex].copyWith(
        quantity: items[existingIndex].quantity + item.quantity,
      );
    } else {
      items.add(item);
    }
  }

  void removeItem(String productId) {
    items.removeWhere((item) => item.productId == productId);
  }

  void updateQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    final index = items.indexWhere((item) => item.productId == productId);
    if (index >= 0) {
      items[index] = items[index].copyWith(quantity: quantity);
    }
  }

  void clear() {
    items.clear();
  }

  CartItem? getItem(String productId) {
    try {
      return items.firstWhere((item) => item.productId == productId);
    } catch (e) {
      return null;
    }
  }

  bool hasItem(String productId) {
    return items.any((item) => item.productId == productId);
  }

  Cart copyWith({List<CartItem>? items}) {
    return Cart(items: items ?? List<CartItem>.from(this.items));
  }
}