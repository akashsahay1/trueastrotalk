class Address {
  final String? id;
  final String fullName;
  final String phoneNumber;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String state;
  final String country;
  final String pincode;
  final String? landmark;
  final bool isDefault;
  final String addressType; // home, office, other
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Address({
    this.id,
    required this.fullName,
    required this.phoneNumber,
    required this.addressLine1,
    this.addressLine2,
    required this.city,
    required this.state,
    required this.country,
    required this.pincode,
    this.landmark,
    required this.isDefault,
    required this.addressType,
    this.createdAt,
    this.updatedAt,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['_id'],
      fullName: json['full_name'] ?? '',
      phoneNumber: json['phone_number'] ?? '',
      addressLine1: json['address_line_1'] ?? '',
      addressLine2: json['address_line_2'],
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      country: json['country'] ?? '',
      pincode: json['pincode'] ?? '',
      landmark: json['landmark'],
      isDefault: json['is_default'] ?? false,
      addressType: json['address_type'] ?? 'home',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) '_id': id,
      'full_name': fullName,
      'phone_number': phoneNumber,
      'address_line_1': addressLine1,
      if (addressLine2 != null) 'address_line_2': addressLine2,
      'city': city,
      'state': state,
      'country': country,
      'pincode': pincode,
      if (landmark != null) 'landmark': landmark,
      'is_default': isDefault,
      'address_type': addressType,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updated_at': updatedAt!.toIso8601String(),
    };
  }

  String get fullAddress {
    final parts = <String>[];
    
    parts.add(addressLine1);
    if (addressLine2?.isNotEmpty == true) parts.add(addressLine2!);
    if (landmark?.isNotEmpty == true) parts.add(landmark!);
    parts.add('$city, $state');
    parts.add('$country - $pincode');
    
    return parts.join(', ');
  }

  String get shortAddress {
    return '$addressLine1, $city, $state - $pincode';
  }

  String get addressTypeDisplayName {
    switch (addressType.toLowerCase()) {
      case 'home':
        return 'Home';
      case 'office':
        return 'Office';
      case 'other':
        return 'Other';
      default:
        return 'Address';
    }
  }

  Address copyWith({
    String? id,
    String? fullName,
    String? phoneNumber,
    String? addressLine1,
    String? addressLine2,
    String? city,
    String? state,
    String? country,
    String? pincode,
    String? landmark,
    bool? isDefault,
    String? addressType,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Address(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      addressLine1: addressLine1 ?? this.addressLine1,
      addressLine2: addressLine2 ?? this.addressLine2,
      city: city ?? this.city,
      state: state ?? this.state,
      country: country ?? this.country,
      pincode: pincode ?? this.pincode,
      landmark: landmark ?? this.landmark,
      isDefault: isDefault ?? this.isDefault,
      addressType: addressType ?? this.addressType,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  bool get isValid {
    return fullName.isNotEmpty &&
           phoneNumber.isNotEmpty &&
           addressLine1.isNotEmpty &&
           city.isNotEmpty &&
           state.isNotEmpty &&
           country.isNotEmpty &&
           pincode.isNotEmpty;
  }
}