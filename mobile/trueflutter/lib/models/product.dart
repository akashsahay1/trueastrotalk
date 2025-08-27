import 'package:flutter/foundation.dart';

class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final String category;
  final String? imageUrl;
  final List<String> images;
  final int stockQuantity;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.category,
    this.imageUrl,
    this.images = const [],
    required this.stockQuantity,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    // Get images array - prefer gallery_images over legacy images field
    final List<String> imagesList = (json['gallery_images'] as List<dynamic>?)?.map((e) => e.toString()).where((url) => url.isNotEmpty).toList() 
        ?? (json['images'] as List<dynamic>?)?.map((e) => e.toString()).where((url) => url.isNotEmpty).toList() 
        ?? [];
    
    // Use featured_image if available, otherwise use first image from gallery_images array
    String? primaryImageUrl = json['featured_image'] ?? json['image_url']; // fallback to old field for compatibility
    if ((primaryImageUrl == null || primaryImageUrl.isEmpty) && imagesList.isNotEmpty) {
      primaryImageUrl = imagesList.first;
    }
    
    return Product(
      id: json['_id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      category: json['category'] ?? '',
      imageUrl: primaryImageUrl,
      images: imagesList,
      stockQuantity: json['stock_quantity'] ?? 0,
      isActive: json['is_active'] ?? false,
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      updatedAt: DateTime.tryParse(json['updated_at'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'name': name,
      'description': description,
      'price': price,
      'category': category,
      'featured_image': imageUrl,
      'images': images,
      'stock_quantity': stockQuantity,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  // Helper getters
  String get formattedPrice => '₹${price.toStringAsFixed(0)}';
  
  String get shortDescription {
    if (description.length <= 100) return description;
    return '${description.substring(0, 97)}...';
  }
  
  bool get isInStock => stockQuantity > 0;
  
  String get stockText {
    if (stockQuantity == 0) return 'Out of Stock';
    if (stockQuantity <= 5) return 'Limited Stock';
    return 'In Stock';
  }
  
  // Handle server image URLs - return as-is for now
  String? get fixedImageUrl {
    if (imageUrl == null || imageUrl!.isEmpty) {
      debugPrint('🖼️ Product $name: imageUrl is null or empty');
      debugPrint('🖼️ Product $name: images array = $images');
      // Try to use first image from images array if available
      if (images.isNotEmpty) {
        debugPrint('🖼️ Product $name: Using first image from array: ${images.first}');
        return images.first;
      }
      return null;
    }
    
    debugPrint('🖼️ Product $name: imageUrl = $imageUrl');
    
    // Return the image URL as-is - let the server handle the correct URLs
    return imageUrl;
  }
}