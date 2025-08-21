import 'package:dio/dio.dart';
import '../../models/address.dart';
import 'endpoints.dart';

class AddressesApiService {
  final Dio _dio;

  AddressesApiService(this._dio);

  // Get user's addresses
  Future<Map<String, dynamic>> getAddresses(String userId) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.addresses,
        queryParameters: {'userId': userId},
      );

      if (response.statusCode == 200 && response.data['success']) {
        final List<dynamic> addressesJson = response.data['addresses'] ?? [];
        final List<Address> addresses = addressesJson
            .map((json) => Address.fromJson(json))
            .toList();

        return {
          'success': true,
          'addresses': addresses,
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to fetch addresses',
          'addresses': <Address>[],
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': _handleDioError(e),
        'addresses': <Address>[],
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Unexpected error: $e',
        'addresses': <Address>[],
      };
    }
  }

  // Create new address
  Future<Map<String, dynamic>> createAddress({
    required String userId,
    required String label,
    required String fullName,
    required String phoneNumber,
    required String addressLine1,
    String? addressLine2,
    required String city,
    required String state,
    required String postalCode,
    String country = 'India',
    String addressType = 'other',
    bool isDefault = false,
  }) async {
    try {
      final response = await _dio.post(
        ApiEndpoints.addresses,
        data: {
          'user_id': userId,
          'label': label,
          'full_name': fullName,
          'phone_number': phoneNumber,
          'address_line_1': addressLine1,
          if (addressLine2 != null) 'address_line_2': addressLine2,
          'city': city,
          'state': state,
          'postal_code': postalCode,
          'country': country,
          'address_type': addressType,
          'is_default': isDefault,
        },
      );

      if (response.statusCode == 201 && response.data['success']) {
        return {
          'success': true,
          'message': response.data['message'],
          'address_id': response.data['address_id'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to create address',
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': _handleDioError(e),
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Unexpected error: $e',
      };
    }
  }

  // Update address
  Future<Map<String, dynamic>> updateAddress({
    required String addressId,
    required String userId,
    String? label,
    String? fullName,
    String? phoneNumber,
    String? addressLine1,
    String? addressLine2,
    String? city,
    String? state,
    String? postalCode,
    String? country,
    String? addressType,
    bool? isDefault,
  }) async {
    try {
      final Map<String, dynamic> data = {
        'address_id': addressId,
        'user_id': userId,
      };

      if (label != null) data['label'] = label;
      if (fullName != null) data['full_name'] = fullName;
      if (phoneNumber != null) data['phone_number'] = phoneNumber;
      if (addressLine1 != null) data['address_line_1'] = addressLine1;
      if (addressLine2 != null) data['address_line_2'] = addressLine2;
      if (city != null) data['city'] = city;
      if (state != null) data['state'] = state;
      if (postalCode != null) data['postal_code'] = postalCode;
      if (country != null) data['country'] = country;
      if (addressType != null) data['address_type'] = addressType;
      if (isDefault != null) data['is_default'] = isDefault;

      final response = await _dio.put(
        ApiEndpoints.addresses,
        data: data,
      );

      if (response.statusCode == 200 && response.data['success']) {
        return {
          'success': true,
          'message': response.data['message'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to update address',
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': _handleDioError(e),
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Unexpected error: $e',
      };
    }
  }

  // Delete address
  Future<Map<String, dynamic>> deleteAddress({
    required String addressId,
    required String userId,
  }) async {
    try {
      final response = await _dio.delete(
        ApiEndpoints.addresses,
        queryParameters: {
          'addressId': addressId,
          'userId': userId,
        },
      );

      if (response.statusCode == 200 && response.data['success']) {
        return {
          'success': true,
          'message': response.data['message'],
        };
      } else {
        return {
          'success': false,
          'error': response.data['error'] ?? 'Failed to delete address',
        };
      }
    } on DioException catch (e) {
      return {
        'success': false,
        'error': _handleDioError(e),
      };
    } catch (e) {
      return {
        'success': false,
        'error': 'Unexpected error: $e',
      };
    }
  }

  String _handleDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timeout. Please try again.';
      case DioExceptionType.badResponse:
        if (e.response?.data != null && e.response!.data['message'] != null) {
          return e.response!.data['message'];
        }
        return 'Server error. Please try again later.';
      case DioExceptionType.cancel:
        return 'Request was cancelled.';
      case DioExceptionType.connectionError:
        return 'No internet connection. Please check your network.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}