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
    return CartItem(
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productImage: product.imageUrl,
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
    return CartItem(
      productId: json['product_id'] ?? '',
      productName: json['product']?['name'] ?? json['product_name'] ?? '',
      productPrice: (json['product']?['price'] as num?)?.toDouble() ?? 
                   (json['product_price'] as num?)?.toDouble() ?? 0.0,
      productImage: json['product']?['images']?[0] ?? json['product_image'],
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
  String get formattedTotalPrice => '₹${totalPrice.toStringAsFixed(0)}';
  String get formattedUnitPrice => '₹${productPrice.toStringAsFixed(0)}';

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
  String get formattedTotalPrice => '₹${totalPrice.toStringAsFixed(0)}';
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