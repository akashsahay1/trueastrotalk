class Review {
  final int id;
  final String customer_name;
  final int rating;
  final String reviewText;
  final int approved;
  final String createdAt;
  final String updatedAt;

  Review({
    required this.id,
    required this.customer_name,
    required this.rating,
    required this.reviewText,
    required this.approved,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
// Extract customer name from nested customer object
    String customerName = "";
    if (json['customer'] != null) {
      final customer = json['customer'];
      final firstName = customer['first_name'] ?? '';
      final lastName = customer['last_name'] ?? '';
      customerName = '$firstName $lastName'.trim();
    }

    return Review(
      id: json['id'] as int,
      customer_name: customerName,
      rating: json['rating'] as int,
      reviewText: json['review_text'] as String,
      approved: json['approved'] as int,
      createdAt: json['created_at'] as String,
      updatedAt: json['updated_at'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customer_name': customer_name,
      'rating': rating,
      'reviewText': reviewText,
      'approved': approved,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }
}
