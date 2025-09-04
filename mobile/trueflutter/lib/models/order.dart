import 'address.dart';
import 'cart.dart';

enum OrderStatus {
  pending,
  confirmed,
  processing,
  shipped,
  outForDelivery,
  delivered,
  cancelled,
  refunded,
}

enum PaymentStatus {
  pending,
  completed,
  failed,
  refunded,
}

enum PaymentMethod {
  razorpay,
  wallet,
  cod, // Cash on Delivery
}

class OrderItem {
  final String productId;
  final String productName;
  final double productPrice;
  final String? productImage;
  final String category;
  final int quantity;
  final double totalPrice;

  OrderItem({
    required this.productId,
    required this.productName,
    required this.productPrice,
    this.productImage,
    required this.category,
    required this.quantity,
    required this.totalPrice,
  });

  factory OrderItem.fromCartItem(CartItem cartItem) {
    return OrderItem(
      productId: cartItem.productId,
      productName: cartItem.productName,
      productPrice: cartItem.productPrice,
      productImage: cartItem.productImage,
      category: cartItem.category,
      quantity: cartItem.quantity,
      totalPrice: cartItem.totalPrice,
    );
  }

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      productId: json['product_id'] ?? '',
      productName: json['product_name'] ?? '',
      productPrice: (json['product_price'] as num?)?.toDouble() ?? 0.0,
      productImage: json['product_image'],
      category: json['category'] ?? '',
      quantity: json['quantity'] ?? 1,
      totalPrice: (json['total_price'] as num?)?.toDouble() ?? 0.0,
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
      'total_price': totalPrice,
    };
  }

  String get formattedPrice => '₹${productPrice.toStringAsFixed(0)}';
  String get formattedTotalPrice => '₹${totalPrice.toStringAsFixed(0)}';
}

class Order {
  final String? id;
  final String? orderNumber;
  final String userId;
  final List<OrderItem> items;
  final double subtotal;
  final double shippingCost;
  final double taxAmount;
  final double totalAmount;
  final OrderStatus status;
  final PaymentStatus paymentStatus;
  final PaymentMethod paymentMethod;
  final String? paymentId;
  final String? razorpayOrderId;
  final Address shippingAddress;
  final Address? billingAddress;
  final DateTime? orderDate;
  final DateTime? expectedDeliveryDate;
  final DateTime? deliveredDate;
  final String? trackingNumber;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Order({
    this.id,
    this.orderNumber,
    required this.userId,
    required this.items,
    required this.subtotal,
    required this.shippingCost,
    required this.taxAmount,
    required this.totalAmount,
    required this.status,
    required this.paymentStatus,
    required this.paymentMethod,
    this.paymentId,
    this.razorpayOrderId,
    required this.shippingAddress,
    this.billingAddress,
    this.orderDate,
    this.expectedDeliveryDate,
    this.deliveredDate,
    this.trackingNumber,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['_id'],
      orderNumber: json['order_number'],
      userId: json['user_id'] ?? '',
      items: (json['items'] as List<dynamic>?)
          ?.map((item) => OrderItem.fromJson(item))
          .toList() ?? [],
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      shippingCost: (json['shipping_cost'] as num?)?.toDouble() ?? 0.0,
      taxAmount: (json['tax_amount'] as num?)?.toDouble() ?? 0.0,
      totalAmount: (json['total_amount'] as num?)?.toDouble() ?? 0.0,
      status: _parseOrderStatus(json['status']),
      paymentStatus: _parsePaymentStatus(json['payment_status']),
      paymentMethod: _parsePaymentMethod(json['payment_method']),
      paymentId: json['payment_id'],
      razorpayOrderId: json['razorpay_order_id'],
      shippingAddress: Address.fromJson(json['shipping_address']),
      billingAddress: json['billing_address'] != null 
          ? Address.fromJson(json['billing_address'])
          : null,
      orderDate: json['order_date'] != null 
          ? DateTime.tryParse(json['order_date'])
          : null,
      expectedDeliveryDate: json['expected_delivery_date'] != null 
          ? DateTime.tryParse(json['expected_delivery_date'])
          : null,
      deliveredDate: json['delivered_date'] != null 
          ? DateTime.tryParse(json['delivered_date'])
          : null,
      trackingNumber: json['tracking_number'],
      notes: json['notes'],
      createdAt: json['created_at'] != null 
          ? DateTime.tryParse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null 
          ? DateTime.tryParse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) '_id': id,
      if (orderNumber != null) 'order_number': orderNumber,
      'user_id': userId,
      'items': items.map((item) => item.toJson()).toList(),
      'subtotal': subtotal,
      'shipping_cost': shippingCost,
      'tax_amount': taxAmount,
      'total_amount': totalAmount,
      'status': status.name,
      'payment_status': paymentStatus.name,
      'payment_method': paymentMethod.name,
      if (paymentId != null) 'payment_id': paymentId,
      if (razorpayOrderId != null) 'razorpay_order_id': razorpayOrderId,
      'shipping_address': shippingAddress.toJson(),
      if (billingAddress != null) 'billing_address': billingAddress!.toJson(),
      if (orderDate != null) 'order_date': orderDate!.toIso8601String(),
      if (expectedDeliveryDate != null) 'expected_delivery_date': expectedDeliveryDate!.toIso8601String(),
      if (deliveredDate != null) 'delivered_date': deliveredDate!.toIso8601String(),
      if (trackingNumber != null) 'tracking_number': trackingNumber,
      if (notes != null) 'notes': notes,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updated_at': updatedAt!.toIso8601String(),
    };
  }

  static OrderStatus _parseOrderStatus(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return OrderStatus.pending;
      case 'confirmed':
        return OrderStatus.confirmed;
      case 'processing':
        return OrderStatus.processing;
      case 'shipped':
        return OrderStatus.shipped;
      case 'out_for_delivery':
      case 'outfordelivery':
        return OrderStatus.outForDelivery;
      case 'delivered':
        return OrderStatus.delivered;
      case 'cancelled':
        return OrderStatus.cancelled;
      case 'refunded':
        return OrderStatus.refunded;
      default:
        return OrderStatus.pending;
    }
  }

  static PaymentStatus _parsePaymentStatus(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return PaymentStatus.pending;
      case 'completed':
        return PaymentStatus.completed;
      case 'failed':
        return PaymentStatus.failed;
      case 'refunded':
        return PaymentStatus.refunded;
      default:
        return PaymentStatus.pending;
    }
  }

  static PaymentMethod _parsePaymentMethod(String? method) {
    switch (method?.toLowerCase()) {
      case 'razorpay':
        return PaymentMethod.razorpay;
      case 'wallet':
        return PaymentMethod.wallet;
      case 'cod':
        return PaymentMethod.cod;
      default:
        return PaymentMethod.razorpay;
    }
  }

  // Getters
  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);
  String get formattedSubtotal => '₹${subtotal.toStringAsFixed(2)}';
  String get formattedShipping => '₹${shippingCost.toStringAsFixed(2)}';
  String get formattedTax => '₹${taxAmount.toStringAsFixed(2)}';
  String get formattedTotal => '₹${totalAmount.toStringAsFixed(2)}';
  
  String get statusDisplayName {
    switch (status) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.confirmed:
        return 'Confirmed';
      case OrderStatus.processing:
        return 'Processing';
      case OrderStatus.shipped:
        return 'Shipped';
      case OrderStatus.outForDelivery:
        return 'Out for Delivery';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.cancelled:
        return 'Cancelled';
      case OrderStatus.refunded:
        return 'Refunded';
    }
  }

  String get paymentStatusDisplayName {
    switch (paymentStatus) {
      case PaymentStatus.pending:
        return 'Payment Pending';
      case PaymentStatus.completed:
        return 'Payment Completed';
      case PaymentStatus.failed:
        return 'Payment Failed';
      case PaymentStatus.refunded:
        return 'Refunded';
    }
  }

  String get paymentMethodDisplayName {
    switch (paymentMethod) {
      case PaymentMethod.razorpay:
        return 'Online Payment';
      case PaymentMethod.wallet:
        return 'Wallet Payment';
      case PaymentMethod.cod:
        return 'Cash on Delivery';
    }
  }

  bool get canBeCancelled {
    return status == OrderStatus.pending || status == OrderStatus.confirmed;
  }

  bool get isDelivered {
    return status == OrderStatus.delivered;
  }

  bool get isCancelled {
    return status == OrderStatus.cancelled;
  }

  bool get isPaymentCompleted {
    return paymentStatus == PaymentStatus.completed;
  }

  String get formattedOrderDate {
    if (orderDate == null) return 'Not available';
    return '${orderDate!.day}/${orderDate!.month}/${orderDate!.year}';
  }

  String get formattedDeliveryDate {
    if (expectedDeliveryDate == null) return 'Not available';
    return '${expectedDeliveryDate!.day}/${expectedDeliveryDate!.month}/${expectedDeliveryDate!.year}';
  }
}