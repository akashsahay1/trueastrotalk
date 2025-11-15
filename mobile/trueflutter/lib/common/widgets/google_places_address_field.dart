import 'package:flutter/material.dart';
import 'package:google_places_flutter/google_places_flutter.dart';
import 'package:google_places_flutter/model/prediction.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../themes/app_colors.dart';
import '../themes/text_styles.dart';
import '../../config/config.dart';

/// Reusable Google Places Address Field with autocomplete
/// Automatically fills city, state, country, and zip code when an address is selected
class GooglePlacesAddressField extends StatefulWidget {
  final TextEditingController addressController;
  final TextEditingController? cityController;
  final TextEditingController? stateController;
  final TextEditingController? countryController;
  final TextEditingController? zipController;
  final String label;
  final String hint;
  final String? Function(String?)? validator;
  final bool enabled;
  final int maxLines;
  final FocusNode? focusNode;
  final VoidCallback? onAddressSelected;
  final bool restrictToCountry;
  final String countryCode; // e.g., "in" for India

  const GooglePlacesAddressField({
    super.key,
    required this.addressController,
    this.cityController,
    this.stateController,
    this.countryController,
    this.zipController,
    this.label = 'Address',
    this.hint = 'Enter address',
    this.validator,
    this.enabled = true,
    this.maxLines = 1,
    this.focusNode,
    this.onAddressSelected,
    this.restrictToCountry = true,
    this.countryCode = 'in',
  });

  @override
  State<GooglePlacesAddressField> createState() => _GooglePlacesAddressFieldState();
}

class _GooglePlacesAddressFieldState extends State<GooglePlacesAddressField> {
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    // Check if Google Places is enabled and API key is available
    if (!Config.enableGooglePlaces || Config.googleMapsApiKey.isEmpty) {
      return _buildFallbackTextField();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GooglePlaceAutoCompleteTextField(
          textEditingController: widget.addressController,
          googleAPIKey: Config.googleMapsApiKey,
          inputDecoration: InputDecoration(
            labelText: widget.label,
            hintText: widget.hint,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.borderLight),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.primary, width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.error),
            ),
            prefixIcon: const Icon(Icons.location_on),
            suffixIcon: _isLoading
                ? const Padding(
                    padding: EdgeInsets.all(12.0),
                    child: SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : null,
            filled: true,
            fillColor: widget.enabled ? AppColors.white : AppColors.background,
          ),
          debounceTime: 600,
          countries: widget.restrictToCountry ? [widget.countryCode] : null,
          isLatLngRequired: false,
          getPlaceDetailWithLatLng: (Prediction prediction) async {
            await _handlePlaceSelection(prediction);
          },
          itemClick: (Prediction prediction) async {
            widget.addressController.text = prediction.description ?? '';
            widget.addressController.selection = TextSelection.fromPosition(
              TextPosition(offset: prediction.description?.length ?? 0),
            );
          },
          itemBuilder: (context, index, Prediction prediction) {
            return Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.white,
                border: Border(
                  bottom: BorderSide(
                    color: AppColors.borderLight.withValues(alpha: 0.5),
                  ),
                ),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.location_on,
                    color: AppColors.primary,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          prediction.structuredFormatting?.mainText ?? '',
                          style: AppTextStyles.bodyMedium.copyWith(
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (prediction.structuredFormatting?.secondaryText != null) ...[
                          const SizedBox(height: 2),
                          Text(
                            prediction.structuredFormatting!.secondaryText!,
                            style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
          seperatedBuilder: const Divider(height: 1),
          containerHorizontalPadding: 0,
          isCrossBtnShown: false,
          focusNode: widget.focusNode,
        ),
        if (widget.validator != null)
          Builder(
            builder: (context) {
              final error = widget.validator!(widget.addressController.text);
              if (error != null) {
                return Padding(
                  padding: const EdgeInsets.only(left: 12, top: 8),
                  child: Text(
                    error,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.error,
                    ),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
      ],
    );
  }

  Widget _buildFallbackTextField() {
    return TextFormField(
      controller: widget.addressController,
      decoration: InputDecoration(
        labelText: widget.label,
        hintText: widget.hint,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        prefixIcon: const Icon(Icons.location_on),
        filled: true,
        fillColor: widget.enabled ? AppColors.white : AppColors.background,
      ),
      enabled: widget.enabled,
      maxLines: widget.maxLines,
      validator: widget.validator,
      focusNode: widget.focusNode,
    );
  }

  Future<void> _handlePlaceSelection(Prediction prediction) async {
    setState(() {
      _isLoading = true;
    });

    try {
      final placeDetails = await _getPlaceDetails(prediction.placeId ?? '');

      if (placeDetails != null) {
        _parseAndFillAddress(placeDetails);
        widget.onAddressSelected?.call();
      } else {
        // Fallback parsing from description
        _fallbackAddressParsing(prediction.description ?? '');
      }
    } catch (e) {
      debugPrint('Error handling place selection: $e');
      // Fallback parsing
      _fallbackAddressParsing(prediction.description ?? '');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<Map<String, dynamic>?> _getPlaceDetails(String placeId) async {
    if (placeId.isEmpty) return null;

    try {
      final url = Uri.parse(
        'https://maps.googleapis.com/maps/api/place/details/json'
        '?place_id=$placeId'
        '&fields=address_components'
        '&key=${Config.googleMapsApiKey}',
      );

      final response = await http.get(url);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['status'] == 'OK') {
          return data['result'];
        }
      }
    } catch (e) {
      debugPrint('Error fetching place details: $e');
    }

    return null;
  }

  void _parseAndFillAddress(Map<String, dynamic> placeDetails) {
    final addressComponents = placeDetails['address_components'] as List<dynamic>? ?? [];

    String? city;
    String? state;
    String? country;
    String? zip;

    for (final component in addressComponents) {
      final types = List<String>.from(component['types'] ?? []);
      final longName = component['long_name'] as String?;
      final shortName = component['short_name'] as String?;

      if (types.contains('locality')) {
        city = longName;
      } else if (types.contains('sublocality_level_1') && city == null) {
        city = longName;
      } else if (types.contains('administrative_area_level_1')) {
        state = longName;
      } else if (types.contains('country')) {
        country = longName;
      } else if (types.contains('postal_code')) {
        zip = shortName ?? longName;
      }
    }

    // Fill only empty fields to preserve user edits
    if (widget.cityController != null && widget.cityController!.text.isEmpty && city != null) {
      widget.cityController!.text = city;
    }
    if (widget.stateController != null && widget.stateController!.text.isEmpty && state != null) {
      widget.stateController!.text = state;
    }
    if (widget.countryController != null && widget.countryController!.text.isEmpty && country != null) {
      widget.countryController!.text = country;
    }
    if (widget.zipController != null && widget.zipController!.text.isEmpty && zip != null) {
      widget.zipController!.text = zip;
    }

    debugPrint('📍 Auto-filled address: City=$city, State=$state, Country=$country, ZIP=$zip');
  }

  void _fallbackAddressParsing(String description) {
    // Simple fallback parsing from description string
    final parts = description.split(',').map((s) => s.trim()).toList();

    if (parts.length >= 2 && widget.cityController != null && widget.cityController!.text.isEmpty) {
      widget.cityController!.text = parts[0];
    }

    if (parts.length >= 3 && widget.stateController != null && widget.stateController!.text.isEmpty) {
      widget.stateController!.text = parts[parts.length - 2];
    }

    if (parts.isNotEmpty && widget.countryController != null && widget.countryController!.text.isEmpty) {
      widget.countryController!.text = parts.last;
    }

    debugPrint('📍 Fallback address parsing from: $description');
  }
}
