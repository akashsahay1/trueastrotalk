import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../models/address.dart';
import '../services/service_locator.dart';
import '../services/api/addresses_api_service.dart';
import '../services/local/local_storage_service.dart';

class AddressFormScreen extends StatefulWidget {
  final Address? address; // For editing existing address

  const AddressFormScreen({super.key, this.address});

  @override
  State<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends State<AddressFormScreen> {
  late final AddressesApiService _addressesApiService;
  late final LocalStorageService _localStorage;
  final _formKey = GlobalKey<FormState>();
  final _scrollController = ScrollController();

  late final TextEditingController _fullNameController;
  late final TextEditingController _phoneController;
  late final TextEditingController _addressLine1Controller;
  late final TextEditingController _addressLine2Controller;
  late final TextEditingController _cityController;
  late final TextEditingController _stateController;
  late final TextEditingController _pincodeController;
  late final TextEditingController _landmarkController;

  String _selectedAddressType = 'home';
  bool _isDefault = false;
  bool _isSaving = false;

  final List<String> _addressTypes = ['home', 'office', 'other'];

  @override
  void initState() {
    super.initState();
    _addressesApiService = getIt<AddressesApiService>();
    _localStorage = getIt<LocalStorageService>();

    final existingAddress = widget.address;

    _fullNameController = TextEditingController(text: existingAddress?.fullName ?? '');
    _phoneController = TextEditingController(text: existingAddress?.phoneNumber ?? '');
    _addressLine1Controller = TextEditingController(text: existingAddress?.addressLine1 ?? '');
    _addressLine2Controller = TextEditingController(text: existingAddress?.addressLine2 ?? '');
    _cityController = TextEditingController(text: existingAddress?.city ?? '');
    _stateController = TextEditingController(text: existingAddress?.state ?? '');
    _pincodeController = TextEditingController(text: existingAddress?.pincode ?? '');
    _landmarkController = TextEditingController(text: existingAddress?.landmark ?? '');

    _selectedAddressType = existingAddress?.addressType ?? 'home';
    _isDefault = existingAddress?.isDefault ?? false;
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _addressLine1Controller.dispose();
    _addressLine2Controller.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    _landmarkController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _saveAddress() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      final address = Address(
        id: widget.address?.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        fullName: _fullNameController.text.trim(),
        phoneNumber: _phoneController.text.trim(),
        addressLine1: _addressLine1Controller.text.trim(),
        addressLine2: _addressLine2Controller.text.trim().isEmpty ? null : _addressLine2Controller.text.trim(),
        city: _cityController.text.trim(),
        state: _stateController.text.trim(),
        country: 'India', // Default to India, can be made configurable
        pincode: _pincodeController.text.trim(),
        landmark: _landmarkController.text.trim().isEmpty ? null : _landmarkController.text.trim(),
        isDefault: _isDefault,
        addressType: _selectedAddressType,
        createdAt: widget.address?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
      );

      // Save to backend
      final userId = _localStorage.getString('user_id') ?? 'user123';
      final result = widget.address != null
          ? await _addressesApiService.updateAddress(
              addressId: widget.address!.id ?? '',
              userId: userId,
              label: '${address.fullName} - ${address.addressType}',
              fullName: address.fullName,
              phoneNumber: address.phoneNumber,
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2,
              city: address.city,
              state: address.state,
              postalCode: address.pincode,
              addressType: address.addressType,
              isDefault: address.isDefault,
            )
          : await _addressesApiService.createAddress(
              userId: userId,
              label: '${address.fullName} - ${address.addressType}',
              fullName: address.fullName,
              phoneNumber: address.phoneNumber,
              addressLine1: address.addressLine1,
              addressLine2: address.addressLine2,
              city: address.city,
              state: address.state,
              postalCode: address.pincode,
              addressType: address.addressType,
              isDefault: address.isDefault,
            );

      if (!result['success']) {
        throw Exception(result['error'] ?? 'Failed to save address');
      }

      if (mounted) {
        Navigator.of(context).pop(address);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to save address: $e'), backgroundColor: AppColors.error));
      }
    } finally {
      setState(() {
        _isSaving = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 243, 245, 249),
      appBar: AppBar(
        title: Text(widget.address == null ? 'Add Address' : 'Edit Address', style: AppTextStyles.heading4.copyWith(color: AppColors.white)),
        backgroundColor: AppColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Form(
        key: _formKey,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                controller: _scrollController,
                padding: const EdgeInsets.all(Dimensions.paddingLg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildContactSection(),
                    const SizedBox(height: Dimensions.spacingLg),
                    _buildAddressSection(),
                    const SizedBox(height: Dimensions.spacingLg),
                    _buildAddressTypeSection(),
                    const SizedBox(height: Dimensions.spacingLg),
                    _buildDefaultAddressSwitch(),
                  ],
                ),
              ),
            ),
            _buildSaveButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildContactSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Contact Information',
              style: AppTextStyles.heading6.copyWith(color: AppColors.textPrimaryLight, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: Dimensions.spacingMd),
            TextFormField(
              controller: _fullNameController,
              decoration: InputDecoration(
                labelText: 'Full Name *',
                prefixIcon: const Icon(Icons.person, color: AppColors.grey400),
                filled: true,
                fillColor: AppColors.grey50,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  borderSide: const BorderSide(color: AppColors.borderLight),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  borderSide: const BorderSide(color: AppColors.primary),
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Full name is required';
                }
                return null;
              },
            ),
            const SizedBox(height: Dimensions.spacingMd),
            TextFormField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(
                labelText: 'Phone Number *',
                prefixIcon: const Icon(Icons.phone, color: AppColors.grey400),
                filled: true,
                fillColor: AppColors.grey50,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  borderSide: const BorderSide(color: AppColors.borderLight),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  borderSide: const BorderSide(color: AppColors.primary),
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Phone number is required';
                }
                if (value.trim().length < 10) {
                  return 'Enter a valid phone number';
                }
                return null;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddressSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Address Details',
              style: AppTextStyles.heading6.copyWith(color: AppColors.textPrimaryLight, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: Dimensions.spacingMd),
            TextFormField(
              controller: _addressLine1Controller,
              decoration: InputDecoration(
                labelText: 'Address Line 1 *',
                hintText: 'House/Flat/Office No, Building Name',
                prefixIcon: const Icon(Icons.home, color: AppColors.grey400),
                filled: true,
                fillColor: AppColors.grey50,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  borderSide: const BorderSide(color: AppColors.borderLight),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  borderSide: const BorderSide(color: AppColors.primary),
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Address line 1 is required';
                }
                return null;
              },
            ),
            const SizedBox(height: Dimensions.spacingMd),
            TextFormField(
              controller: _addressLine2Controller,
              decoration: InputDecoration(
                labelText: 'Address Line 2',
                hintText: 'Street, Area, Colony (Optional)',
                prefixIcon: const Icon(Icons.location_on, color: AppColors.grey400),
                filled: true,
                fillColor: AppColors.grey50,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  borderSide: const BorderSide(color: AppColors.borderLight),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  borderSide: const BorderSide(color: AppColors.primary),
                ),
              ),
            ),
            const SizedBox(height: Dimensions.spacingMd),
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: TextFormField(
                    controller: _cityController,
                    decoration: InputDecoration(
                      labelText: 'City *',
                      prefixIcon: const Icon(Icons.location_city, color: AppColors.grey400),
                      filled: true,
                      fillColor: AppColors.grey50,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                        borderSide: const BorderSide(color: AppColors.borderLight),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                        borderSide: const BorderSide(color: AppColors.primary),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'City is required';
                      }
                      return null;
                    },
                  ),
                ),
                const SizedBox(width: Dimensions.spacingMd),
                Expanded(
                  flex: 1,
                  child: TextFormField(
                    controller: _pincodeController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Pincode *',
                      filled: true,
                      fillColor: AppColors.grey50,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                        borderSide: const BorderSide(color: AppColors.borderLight),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                        borderSide: const BorderSide(color: AppColors.primary),
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Pincode is required';
                      }
                      if (value.trim().length != 6) {
                        return 'Enter valid pincode';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: Dimensions.spacingMd),
            TextFormField(
              controller: _stateController,
              decoration: InputDecoration(
                labelText: 'State *',
                prefixIcon: const Icon(Icons.map, color: AppColors.grey400),
                filled: true,
                fillColor: AppColors.grey50,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  borderSide: const BorderSide(color: AppColors.borderLight),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  borderSide: const BorderSide(color: AppColors.primary),
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'State is required';
                }
                return null;
              },
            ),
            const SizedBox(height: Dimensions.spacingMd),
            TextFormField(
              controller: _landmarkController,
              decoration: InputDecoration(
                labelText: 'Landmark',
                hintText: 'Nearby landmark for easy identification',
                prefixIcon: const Icon(Icons.place, color: AppColors.grey400),
                filled: true,
                fillColor: AppColors.grey50,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  borderSide: const BorderSide(color: AppColors.borderLight),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                  borderSide: const BorderSide(color: AppColors.primary),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddressTypeSection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Address Type',
              style: AppTextStyles.heading6.copyWith(color: AppColors.textPrimaryLight, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: Dimensions.spacingMd),
            Row(
              children: _addressTypes.map((type) {
                final isSelected = _selectedAddressType == type;
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: InkWell(
                      onTap: () {
                        setState(() {
                          _selectedAddressType = type;
                        });
                      },
                      borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingMd, horizontal: Dimensions.paddingSm),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.primary.withValues(alpha: 0.1) : AppColors.grey50,
                          border: Border.all(color: isSelected ? AppColors.primary : AppColors.borderLight, width: isSelected ? 2 : 1),
                          borderRadius: BorderRadius.circular(Dimensions.radiusSm),
                        ),
                        child: Column(
                          children: [
                            Icon(_getAddressTypeIcon(type), color: isSelected ? AppColors.primary : AppColors.grey400),
                            const SizedBox(height: 4),
                            Text(
                              _getAddressTypeDisplayName(type),
                              style: AppTextStyles.bodySmall.copyWith(color: isSelected ? AppColors.primary : AppColors.grey600, fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDefaultAddressSwitch() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: Padding(
        padding: const EdgeInsets.all(Dimensions.paddingLg),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Set as Default Address',
                    style: AppTextStyles.bodyLarge.copyWith(color: AppColors.textPrimaryLight, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 2),
                  Text('Use this address as your default delivery address', style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight)),
                ],
              ),
            ),
            Switch(
              value: _isDefault,
              onChanged: (value) {
                setState(() {
                  _isDefault = value;
                });
              },
              activeThumbColor: AppColors.primary,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSaveButton() {
    return Container(
      padding: const EdgeInsets.all(Dimensions.paddingLg),
      decoration: const BoxDecoration(
        color: AppColors.white,
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, -2))],
      ),
      child: SafeArea(
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _isSaving ? null : _saveAddress,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(vertical: Dimensions.paddingMd),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
            ),
            child: _isSaving ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)) : Text(widget.address == null ? 'Save Address' : 'Update Address', style: AppTextStyles.bodyLarge.copyWith(fontWeight: FontWeight.w600)),
          ),
        ),
      ),
    );
  }

  IconData _getAddressTypeIcon(String type) {
    switch (type) {
      case 'home':
        return Icons.home;
      case 'office':
        return Icons.business;
      case 'other':
        return Icons.location_on;
      default:
        return Icons.location_on;
    }
  }

  String _getAddressTypeDisplayName(String type) {
    switch (type) {
      case 'home':
        return 'Home';
      case 'office':
        return 'Office';
      case 'other':
        return 'Other';
      default:
        return 'Other';
    }
  }
}
