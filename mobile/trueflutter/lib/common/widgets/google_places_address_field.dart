import 'package:flutter/material.dart';
import 'dart:convert';
import 'dart:async';
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
  final String countryCode;

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
  final LayerLink _layerLink = LayerLink();
  OverlayEntry? _overlayEntry;
  List<Map<String, dynamic>> _predictions = [];
  bool _isLoading = false;
  Timer? _debounceTimer;
  FocusNode? _internalFocusNode;
  bool _isSelecting = false;

  FocusNode get _focusNode => widget.focusNode ?? (_internalFocusNode ??= FocusNode());

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(_onFocusChange);
    widget.addressController.addListener(_onTextChanged);
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _removeOverlay();
    _focusNode.removeListener(_onFocusChange);
    widget.addressController.removeListener(_onTextChanged);
    _internalFocusNode?.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    if (!_focusNode.hasFocus) {
      Future.delayed(const Duration(milliseconds: 200), () {
        if (!_isSelecting) {
          _removeOverlay();
        }
      });
    }
  }

  void _onTextChanged() {
    if (_isSelecting) return;

    final text = widget.addressController.text;
    debugPrint('📍 Address text changed: "$text" (length: ${text.length})');

    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _searchPlaces(text);
    });
  }

  Future<void> _searchPlaces(String query) async {
    if (query.length < 3 || !Config.enableGooglePlaces || Config.googleMapsApiKey.isEmpty) {
      _removeOverlay();
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      String url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json'
          '?input=${Uri.encodeComponent(query)}'
          '&key=${Config.googleMapsApiKey}';

      if (widget.restrictToCountry) {
        url += '&components=country:${widget.countryCode}';
      }

      final response = await http.get(Uri.parse(url));
      debugPrint('📍 Places API response status: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        debugPrint('📍 Places API status: ${data['status']}, predictions: ${data['predictions']?.length ?? 0}');
        if (data['status'] == 'OK') {
          if (mounted) {
            setState(() {
              _predictions = List<Map<String, dynamic>>.from(data['predictions']);
            });
            _showOverlay();
          }
        } else {
          debugPrint('📍 Places API error: ${data['error_message'] ?? data['status']}');
          _removeOverlay();
        }
      }
    } catch (e) {
      debugPrint('📍 Error searching places: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showOverlay() {
    _removeOverlay();

    if (_predictions.isEmpty || !mounted) return;

    final RenderBox? renderBox = context.findRenderObject() as RenderBox?;
    if (renderBox == null) return;

    final size = renderBox.size;

    final overlayWidth = size.width;

    _overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        width: overlayWidth,
        child: CompositedTransformFollower(
          link: _layerLink,
          showWhenUnlinked: false,
          offset: const Offset(0, 4),
          targetAnchor: Alignment.bottomLeft,
          followerAnchor: Alignment.topLeft,
          child: Material(
            elevation: 4,
            borderRadius: BorderRadius.circular(12),
            color: AppColors.white,
            child: Container(
              constraints: const BoxConstraints(maxHeight: 180),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(11),
                child: ListView.builder(
                  padding: EdgeInsets.zero,
                  shrinkWrap: true,
                  itemCount: _predictions.length,
                  itemBuilder: (context, index) {
                    final prediction = _predictions[index];
                    final mainText = prediction['structured_formatting']?['main_text'] ?? '';
                    final secondaryText = prediction['structured_formatting']?['secondary_text'] ?? '';

                    return InkWell(
                      onTap: () => _selectPrediction(prediction),
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          border: index < _predictions.length - 1
                              ? Border(
                                  bottom: BorderSide(
                                    color: AppColors.borderLight.withValues(alpha: 0.5),
                                  ),
                                )
                              : null,
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.location_on_outlined,
                              color: AppColors.primary,
                              size: 20,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    mainText,
                                    style: AppTextStyles.bodyMedium.copyWith(
                                      fontWeight: FontWeight.w500,
                                      color: AppColors.textPrimaryLight,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  if (secondaryText.isNotEmpty) ...[
                                    const SizedBox(height: 2),
                                    Text(
                                      secondaryText,
                                      style: AppTextStyles.bodySmall.copyWith(
                                        color: AppColors.textSecondaryLight,
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
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );

    Overlay.of(context).insert(_overlayEntry!);
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
  }

  Future<void> _selectPrediction(Map<String, dynamic> prediction) async {
    _isSelecting = true;
    _removeOverlay();

    final description = prediction['description'] ?? '';
    widget.addressController.text = description;
    widget.addressController.selection = TextSelection.fromPosition(
      TextPosition(offset: description.length),
    );

    // Fetch place details
    final placeId = prediction['place_id'];
    if (placeId != null) {
      await _fetchPlaceDetails(placeId);
    }

    _isSelecting = false;
    _predictions = [];
  }

  Future<void> _fetchPlaceDetails(String placeId) async {
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
          _parseAndFillAddress(data['result']);
          widget.onAddressSelected?.call();
        }
      }
    } catch (e) {
      debugPrint('Error fetching place details: $e');
    }
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

    if (widget.cityController != null && city != null) {
      widget.cityController!.text = city;
    }
    if (widget.stateController != null && state != null) {
      widget.stateController!.text = state;
    }
    if (widget.countryController != null && country != null) {
      widget.countryController!.text = country;
    }
    if (widget.zipController != null && zip != null) {
      widget.zipController!.text = zip;
    }

    debugPrint('📍 Auto-filled address: City=$city, State=$state, Country=$country, ZIP=$zip');
  }

  @override
  Widget build(BuildContext context) {
    return CompositedTransformTarget(
      link: _layerLink,
      child: TextFormField(
        controller: widget.addressController,
        focusNode: _focusNode,
        enabled: widget.enabled,
        maxLines: widget.maxLines,
        validator: widget.validator,
        style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textPrimaryLight),
        decoration: InputDecoration(
          labelText: widget.label,
          hintText: widget.hint,
          labelStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondaryLight),
          hintStyle: AppTextStyles.bodyMedium.copyWith(
            color: AppColors.textSecondaryLight,
            fontStyle: FontStyle.italic,
          ),
          prefixIcon: const Icon(
            Icons.location_on_outlined,
            color: AppColors.primary,
            size: 20,
          ),
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
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.borderLight),
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
            borderSide: const BorderSide(color: AppColors.error, width: 2),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.error, width: 2),
          ),
          filled: true,
          fillColor: widget.enabled ? AppColors.white : AppColors.grey50,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
      ),
    );
  }
}
