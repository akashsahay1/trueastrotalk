import 'package:flutter/material.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/constants/dimensions.dart';
import '../models/address.dart';
import '../services/service_locator.dart';
import '../services/local/local_storage_service.dart';
import '../services/api/addresses_api_service.dart';
import 'address_form.dart';

class AddressListScreen extends StatefulWidget {
  final bool isSelectionMode;

  const AddressListScreen({
    super.key,
    this.isSelectionMode = true,
  });

  @override
  State<AddressListScreen> createState() => _AddressListScreenState();
}

class _AddressListScreenState extends State<AddressListScreen> {
  late final LocalStorageService _localStorage;
  late final AddressesApiService _addressesApiService;
  
  List<Address> _addresses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _localStorage = getIt<LocalStorageService>();
    _addressesApiService = getIt<AddressesApiService>();
    _loadAddresses();
  }

  Future<void> _loadAddresses() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Load addresses from API
      final userId = _localStorage.getString('user_id') ?? 'user123';
      final result = await _addressesApiService.getAddresses(userId);
      
      if (result['success']) {
        _addresses = result['addresses'] as List<Address>;
      } else {
        debugPrint('Failed to load addresses: ${result['error']}');
        _addresses = _getSampleAddresses(); // Fallback to sample data
      }
    } catch (e) {
      debugPrint('Error loading addresses: $e');
      _addresses = _getSampleAddresses();
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  List<Address> _getSampleAddresses() {
    return [
      Address(
        id: '1',
        fullName: 'John Doe',
        phoneNumber: '+91 9876543210',
        addressLine1: '123, Main Street',
        addressLine2: 'Near City Mall',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400001',
        landmark: 'Opposite Bank of India',
        isDefault: true,
        addressType: 'home',
        createdAt: DateTime.now().subtract(const Duration(days: 10)),
      ),
      Address(
        id: '2',
        fullName: 'John Doe',
        phoneNumber: '+91 9876543210',
        addressLine1: '456, Business Park',
        addressLine2: 'Floor 5, Wing A',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400070',
        isDefault: false,
        addressType: 'office',
        createdAt: DateTime.now().subtract(const Duration(days: 5)),
      ),
    ];
  }

  Future<void> _addNewAddress() async {
    final newAddress = await Navigator.push<Address>(
      context,
      MaterialPageRoute(
        builder: (context) => const AddressFormScreen(),
      ),
    );

    if (newAddress != null) {
      setState(() {
        _addresses.add(newAddress);
      });
      await _saveAddresses();
    }
  }

  Future<void> _editAddress(Address address) async {
    final updatedAddress = await Navigator.push<Address>(
      context,
      MaterialPageRoute(
        builder: (context) => AddressFormScreen(address: address),
      ),
    );

    if (updatedAddress != null) {
      setState(() {
        final index = _addresses.indexWhere((a) => a.id == address.id);
        if (index >= 0) {
          _addresses[index] = updatedAddress;
        }
      });
      await _saveAddresses();
    }
  }

  Future<void> _deleteAddress(Address address) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Address'),
        content: Text('Are you sure you want to delete this ${address.addressTypeDisplayName.toLowerCase()} address?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );

    if (result == true) {
      setState(() {
        _addresses.removeWhere((a) => a.id == address.id);
      });
      await _saveAddresses();
    }
  }

  Future<void> _setAsDefault(Address address) async {
    setState(() {
      // Remove default from all addresses
      for (int i = 0; i < _addresses.length; i++) {
        _addresses[i] = _addresses[i].copyWith(isDefault: false);
      }
      
      // Set selected address as default
      final index = _addresses.indexWhere((a) => a.id == address.id);
      if (index >= 0) {
        _addresses[index] = _addresses[index].copyWith(isDefault: true);
      }
    });
    
    await _saveAddresses();
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Default address updated'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  Future<void> _saveAddresses() async {
    try {
      // Save to local storage
      // In production, sync with backend
      final addressesJson = _addresses.map((a) => a.toJson()).toList().toString();
      await _localStorage.saveString('user_addresses', addressesJson);
    } catch (e) {
      debugPrint('Error saving addresses: $e');
    }
  }

  void _selectAddress(Address address) {
    Navigator.of(context).pop(address);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 243, 245, 249),
      appBar: AppBar(
        title: Text(
          widget.isSelectionMode ? 'Select Address' : 'My Addresses',
          style: AppTextStyles.heading4.copyWith(color: AppColors.white),
        ),
        backgroundColor: AppColors.primary,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.white),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, color: AppColors.white),
            onPressed: _addNewAddress,
            tooltip: 'Add Address',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _addresses.isEmpty
              ? _buildEmptyState()
              : ListView.separated(
                  padding: const EdgeInsets.all(Dimensions.paddingLg),
                  itemCount: _addresses.length,
                  separatorBuilder: (context, index) => const SizedBox(height: Dimensions.spacingMd),
                  itemBuilder: (context, index) => _buildAddressCard(_addresses[index]),
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.location_on_outlined,
            size: 64,
            color: AppColors.grey400,
          ),
          const SizedBox(height: Dimensions.spacingMd),
          Text(
            'No addresses found',
            style: AppTextStyles.heading5.copyWith(color: AppColors.grey600),
          ),
          const SizedBox(height: Dimensions.spacingSm),
          Text(
            'Add your first address to get started',
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.grey400),
          ),
          const SizedBox(height: Dimensions.spacingLg),
          ElevatedButton.icon(
            onPressed: _addNewAddress,
            icon: const Icon(Icons.add),
            label: const Text('Add Address'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(
                horizontal: Dimensions.paddingXl,
                vertical: Dimensions.paddingMd,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(Dimensions.radiusMd),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressCard(Address address) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(Dimensions.radiusMd)),
      child: InkWell(
        borderRadius: BorderRadius.circular(Dimensions.radiusMd),
        onTap: widget.isSelectionMode ? () => _selectAddress(address) : null,
        child: Padding(
          padding: const EdgeInsets.all(Dimensions.paddingLg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      address.addressTypeDisplayName,
                      style: AppTextStyles.overline.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: Dimensions.spacingSm),
                  if (address.isDefault)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Default',
                        style: AppTextStyles.overline.copyWith(
                          color: AppColors.success,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  const Spacer(),
                  PopupMenuButton<String>(
                    onSelected: (value) {
                      switch (value) {
                        case 'edit':
                          _editAddress(address);
                          break;
                        case 'delete':
                          _deleteAddress(address);
                          break;
                        case 'default':
                          _setAsDefault(address);
                          break;
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit, size: 18),
                            SizedBox(width: 8),
                            Text('Edit'),
                          ],
                        ),
                      ),
                      if (!address.isDefault)
                        const PopupMenuItem(
                          value: 'default',
                          child: Row(
                            children: [
                              Icon(Icons.star, size: 18),
                              SizedBox(width: 8),
                              Text('Set as Default'),
                            ],
                          ),
                        ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete, size: 18, color: AppColors.error),
                            SizedBox(width: 8),
                            Text('Delete', style: TextStyle(color: AppColors.error)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: Dimensions.spacingMd),
              Text(
                address.fullName,
                style: AppTextStyles.bodyLarge.copyWith(
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimaryLight,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                address.phoneNumber,
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondaryLight),
              ),
              const SizedBox(height: Dimensions.spacingSm),
              Text(
                address.fullAddress,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.textSecondaryLight,
                  height: 1.4,
                ),
              ),
              
              if (widget.isSelectionMode) ...[
                const SizedBox(height: Dimensions.spacingMd),
                Row(
                  children: [
                    const Spacer(),
                    TextButton(
                      onPressed: () => _selectAddress(address),
                      child: Text(
                        'Select This Address',
                        style: AppTextStyles.bodyMedium.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}