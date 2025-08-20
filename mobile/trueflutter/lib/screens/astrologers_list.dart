import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../services/api/user_api_service.dart';
import '../models/astrologer.dart';

enum SortBy { name, callRate, chatRate, rating, experience }
enum FilterBy { all, online, offline }

class AstrologersListScreen extends StatefulWidget {
  final UserApiService userApiService;
  final Function(Astrologer) onAstrologerTap;
  final Function(Astrologer) onStartChat;
  final Function(Astrologer) onStartCall;

  const AstrologersListScreen({
    super.key,
    required this.userApiService,
    required this.onAstrologerTap,
    required this.onStartChat,
    required this.onStartCall,
  });

  @override
  State<AstrologersListScreen> createState() => _AstrologersListScreenState();
}

class _AstrologersListScreenState extends State<AstrologersListScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  Timer? _searchDebounce;
  
  List<Astrologer> _allAstrologers = [];
  List<Astrologer> _filteredAstrologers = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  
  // Filter and sort state
  SortBy _currentSort = SortBy.name;
  FilterBy _currentFilter = FilterBy.all;
  String _searchQuery = '';
  final Set<String> _selectedSkills = {};
  final Set<String> _selectedLanguages = {};
  double _minExperience = 0;
  double _maxExperience = 50; // Increased to accommodate astrologers with high experience
  
  // Temporary filter state for dialog
  SortBy _tempSort = SortBy.name;
  FilterBy _tempFilter = FilterBy.all;
  final Set<String> _tempSelectedSkills = {};
  final Set<String> _tempSelectedLanguages = {};
  double _tempMinExperience = 0;
  double _tempMaxExperience = 50;
  
  // Pagination
  int _currentOffset = 0;
  final int _limit = 20;
  bool _hasMore = true;
  
  // Available filter options
  List<String> _availableSkills = [];
  List<String> _availableLanguages = [];

  @override
  void initState() {
    super.initState();
    _loadAstrologers();
    _scrollController.addListener(_onScroll);
    _searchController.addListener(_onSearchChanged);
    _loadSkillOptions();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    _searchDebounce?.cancel();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      if (!_isLoadingMore && _hasMore && !_isLoading) {
        _loadMoreAstrologers();
      }
    }
  }

  void _onSearchChanged() {
    // Cancel previous search if it exists
    _searchDebounce?.cancel();
    
    // Debounce search by 500ms
    _searchDebounce = Timer(const Duration(milliseconds: 500), () {
      setState(() {
        _searchQuery = _searchController.text;
        // Reset pagination when search changes
        _currentOffset = 0;
        _hasMore = true;
      });
      // Reload with new search query
      _loadAstrologers(refresh: true);
    });
  }

  Future<void> _loadSkillOptions() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      final skills = prefs.getStringList('astrologer_skills') ?? [];
      final languages = prefs.getStringList('astrologer_languages') ?? [];
      
      setState(() {
        _availableSkills = skills;
        _availableLanguages = languages;
      });
      
      // If no data found, fetch from API as fallback
      if (_availableSkills.isEmpty || _availableLanguages.isEmpty) {
        final options = await widget.userApiService.getAstrologerOptions();
        
        setState(() {
          _availableSkills = options['skills'] ?? [];
          _availableLanguages = options['languages'] ?? [];
        });
        
        // Save to SharedPreferences for next time
        await prefs.setStringList('astrologer_skills', _availableSkills);
        await prefs.setStringList('astrologer_languages', _availableLanguages);
      }
    } catch (e) {
      // Handle error silently or use proper logging
    }
  }

  Future<void> _loadAstrologers({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _currentOffset = 0;
        _hasMore = true;
        _isLoading = true;
        _allAstrologers.clear();
        _filteredAstrologers.clear();
      });
    }

    try {
      final astrologersData = await widget.userApiService.getAvailableAstrologers(
        limit: _limit,
        offset: refresh ? 0 : _currentOffset,
        onlineOnly: false,
      );

      final newAstrologers = (astrologersData['astrologers'] as List<dynamic>)
          .map((json) => Astrologer.fromJson(json))
          .toList();

      // Get has_more from backend response, fallback to checking length
      final hasMore = astrologersData['has_more'] as bool? ?? (newAstrologers.length == _limit);

      setState(() {
        if (refresh) {
          _allAstrologers = newAstrologers;
          _currentOffset = newAstrologers.length;
        } else {
          _allAstrologers.addAll(newAstrologers);
          _currentOffset += newAstrologers.length;
        }
        _hasMore = hasMore;
        _isLoading = false;
        _isLoadingMore = false;
      });

      _applyFiltersAndSort();
    } catch (e) {
      debugPrint('Error loading astrologers: $e');
      setState(() {
        _isLoading = false;
        _isLoadingMore = false;
      });
    }
  }

  Future<void> _loadMoreAstrologers() async {
    if (_isLoadingMore || !_hasMore) return;
    
    setState(() {
      _isLoadingMore = true;
    });

    await _loadAstrologers();
  }

  void _applyFiltersAndSort() {
    List<Astrologer> filtered = List.from(_allAstrologers);

    // Apply search filter
    if (_searchQuery.isNotEmpty) {
      filtered = filtered.where((astrologer) {
        return astrologer.fullName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
               astrologer.skillsText.toLowerCase().contains(_searchQuery.toLowerCase()) ||
               astrologer.languagesText.toLowerCase().contains(_searchQuery.toLowerCase());
      }).toList();
    }

    // Apply online/offline filter
    if (_currentFilter == FilterBy.online) {
      filtered = filtered.where((astrologer) => astrologer.isOnline).toList();
    } else if (_currentFilter == FilterBy.offline) {
      filtered = filtered.where((astrologer) => !astrologer.isOnline).toList();
    }

    // Apply skill filter
    if (_selectedSkills.isNotEmpty) {
      filtered = filtered.where((astrologer) => 
        _selectedSkills.any((skill) => astrologer.skills.contains(skill))).toList();
    }

    // Apply language filter
    if (_selectedLanguages.isNotEmpty) {
      filtered = filtered.where((astrologer) => 
        _selectedLanguages.any((language) => astrologer.languages.contains(language))).toList();
    }

    // Apply experience filter
    filtered = filtered.where((astrologer) => 
      astrologer.experienceYears >= _minExperience && 
      astrologer.experienceYears <= _maxExperience).toList();

    // Apply sorting
    switch (_currentSort) {
      case SortBy.name:
        filtered.sort((a, b) => a.fullName.compareTo(b.fullName));
        break;
      case SortBy.callRate:
        filtered.sort((a, b) => a.callRate.compareTo(b.callRate));
        break;
      case SortBy.chatRate:
        filtered.sort((a, b) => a.chatRate.compareTo(b.chatRate));
        break;
      case SortBy.rating:
        filtered.sort((a, b) => b.rating.compareTo(a.rating)); // Descending
        break;
      case SortBy.experience:
        filtered.sort((a, b) => b.experienceYears.compareTo(a.experienceYears)); // Descending
        break;
    }

    setState(() {
      _filteredAstrologers = filtered;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 243, 245, 249),
      appBar: AppBar(
        title: Text('Astrologers', style: AppTextStyles.heading4.copyWith(color: AppColors.white)),
        backgroundColor: AppColors.primary,
        elevation: 0,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.tune, color: AppColors.white),
            onPressed: _showAdvancedFilterDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          _buildActiveFilters(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredAstrologers.isEmpty
                    ? _buildEmptyState()
                    : _buildAstrologersList(),
          ),
        ],
      ),
    );
  }


  Widget _buildActiveFilters() {
    List<Widget> activeFilters = [];

    // Add search filter chip
    if (_searchQuery.isNotEmpty) {
      activeFilters.add(_buildFilterChip(
        'Search: "$_searchQuery"',
        () => setState(() {
          _searchController.clear();
          _searchQuery = '';
          _applyFiltersAndSort();
        }),
      ));
    }

    // Add sort filter chip (only if not default)
    if (_currentSort != SortBy.name) {
      String sortText = '';
      switch (_currentSort) {
        case SortBy.chatRate:
          sortText = 'Sort: Chat Rate';
          break;
        case SortBy.callRate:
          sortText = 'Sort: Call Rate';
          break;
        case SortBy.rating:
          sortText = 'Sort: Rating';
          break;
        case SortBy.experience:
          sortText = 'Sort: Experience';
          break;
        default:
          sortText = 'Sort: Name';
      }
      activeFilters.add(_buildFilterChip(
        sortText,
        () => setState(() {
          _currentSort = SortBy.name;
          _applyFiltersAndSort();
        }),
      ));
    }

    if (_currentFilter != FilterBy.all) {
      activeFilters.add(_buildFilterChip(
        _currentFilter == FilterBy.online ? 'Online Only' : 'Offline Only',
        () => setState(() {
          _currentFilter = FilterBy.all;
          _applyFiltersAndSort();
        }),
      ));
    }

    if (_selectedSkills.isNotEmpty) {
      activeFilters.add(_buildFilterChip(
        'Skills: ${_selectedSkills.take(2).join(", ")}${_selectedSkills.length > 2 ? "+${_selectedSkills.length - 2}" : ""}',
        () => setState(() {
          _selectedSkills.clear();
          _applyFiltersAndSort();
        }),
      ));
    }

    if (_selectedLanguages.isNotEmpty) {
      activeFilters.add(_buildFilterChip(
        'Languages: ${_selectedLanguages.take(2).join(", ")}${_selectedLanguages.length > 2 ? "+${_selectedLanguages.length - 2}" : ""}',
        () => setState(() {
          _selectedLanguages.clear();
          _applyFiltersAndSort();
        }),
      ));
    }

    if (_minExperience > 0 || _maxExperience < 20) {
      String experienceText = 'Experience: ${_minExperience.toInt()}-${_maxExperience.toInt()} years';
      
      activeFilters.add(_buildFilterChip(
        experienceText,
        () => setState(() {
          _minExperience = 0;
          _maxExperience = 20;
          _applyFiltersAndSort();
        }),
      ));
    }

    if (activeFilters.isEmpty) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: AppColors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Active Filters:', style: AppTextStyles.bodySmall.copyWith(
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              )),
              if (activeFilters.isNotEmpty)
                TextButton(
                  onPressed: () {
                    _searchController.clear();
                    setState(() {
                      _searchQuery = '';
                      _currentSort = SortBy.name;
                      _currentFilter = FilterBy.all;
                      _selectedSkills.clear();
                      _selectedLanguages.clear();
                      _minExperience = 0;
                      _maxExperience = 20;
                    });
                    _applyFiltersAndSort();
                  },
                  child: Text('Clear All', style: TextStyle(
                    color: AppColors.primary,
                    fontSize: 12,
                  )),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: activeFilters,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, VoidCallback onRemove) {
    return Chip(
      label: Text(label, style: const TextStyle(fontSize: 12)),
      deleteIcon: const Icon(Icons.close, size: 16),
      onDeleted: onRemove,
      backgroundColor: AppColors.primary.withValues(alpha: 0.1),
      deleteIconColor: AppColors.primary,
      labelStyle: TextStyle(color: AppColors.primary),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.people_outline, size: 64, color: AppColors.textSecondary),
          const SizedBox(height: 16),
          Text(
            'No astrologers found',
            style: AppTextStyles.heading6.copyWith(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 8),
          Text(
            'Try adjusting your search or filters',
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              _searchController.clear();
              setState(() {
                _currentFilter = FilterBy.all;
                _selectedSkills.clear();
                _selectedLanguages.clear();
                _minExperience = 0;
                _maxExperience = 20;
              });
              _applyFiltersAndSort();
            },
            child: const Text('Clear All Filters'),
          ),
        ],
      ),
    );
  }

  Widget _buildAstrologersList() {
    return RefreshIndicator(
      onRefresh: () => _loadAstrologers(refresh: true),
      child: ListView.builder(
        controller: _scrollController,
        padding: const EdgeInsets.all(16),
        itemCount: _filteredAstrologers.length + (_getFooterItemCount()),
        itemBuilder: (context, index) {
          if (index == _filteredAstrologers.length) {
            // Show loading indicator or end message
            if (_isLoadingMore) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(),
                ),
              );
            } else if (!_hasMore && _filteredAstrologers.isNotEmpty) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Text(
                    'No more astrologers to load',
                    style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 14,
                    ),
                  ),
                ),
              );
            }
          }

          final astrologer = _filteredAstrologers[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: _buildAstrologerCard(astrologer),
          );
        },
      ),
    );
  }
  
  int _getFooterItemCount() {
    if (_isLoadingMore) return 1;
    if (!_hasMore && _filteredAstrologers.isNotEmpty) return 1;
    return 0;
  }

  Widget _buildAstrologerCard(Astrologer astrologer) {
    String truncateTextWithComma(String text) {
      List<String> parts = text.split(',').map((e) => e.trim()).toList();
      if (parts.length >= 2) {
        return '${parts[0]}, ${parts[1]}';
      } else if (parts.length == 1) {
        return parts[0];
      } else {
        return '';
      }
    }

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => widget.onAstrologerTap(astrologer),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Astrologer image with online indicator
              Column(
                children: [
                  Stack(
                    children: [
                      _buildAstrologerProfileImage(astrologer),
                      Positioned(
                        top: 2,
                        right: 2,
                        child: Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: astrologer.isOnline ? AppColors.success : AppColors.error,
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.white, width: 2),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(astrologer.ratingText, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 16)),
                      const SizedBox(width: 2),
                      const Icon(Icons.star, color: Colors.amber, size: 20),
                    ],
                  ),
                ],
              ),
              const SizedBox(width: 16),
              // Astrologer details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      astrologer.fullName,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.auto_graph, size: 16, color: Colors.grey),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            truncateTextWithComma(astrologer.skillsText),
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.language, size: 16, color: Colors.grey),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            truncateTextWithComma(astrologer.languagesText),
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        const Icon(Icons.work_outline, size: 16, color: Colors.grey),
                        const SizedBox(width: 4),
                        Text(
                          '${astrologer.experienceYears} years exp',
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              // Action buttons
              Column(
                children: [
                  SizedBox(
                    width: 80,
                    height: 32,
                    child: ElevatedButton(
                      onPressed: () => widget.onStartChat(astrologer),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF00C16E),
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                      ),
                      child: Text(
                        astrologer.chatRate.toInt() == 0 ? "FREE" : "₹${astrologer.chatRate.toInt()}/min",
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: 80,
                    height: 32,
                    child: OutlinedButton(
                      onPressed: () => widget.onStartCall(astrologer),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFF1877F2)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                      ),
                      child: Text(
                        astrologer.callRate.toInt() == 0 ? "FREE" : "₹${astrologer.callRate.toInt()}/min",
                        style: const TextStyle(color: Color(0xFF1877F2), fontSize: 11),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAstrologerProfileImage(Astrologer astrologer) {
    if (astrologer.profileImage != null && astrologer.profileImage!.isNotEmpty) {
      return CircleAvatar(
        radius: 30,
        backgroundColor: AppColors.primary.withValues(alpha: 0.1),
        child: ClipOval(
          child: Image.network(
            astrologer.profileImage!,
            width: 60,
            height: 60,
            fit: BoxFit.cover,
            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) return child;
              return const Icon(Icons.person, size: 30, color: AppColors.primary);
            },
            errorBuilder: (context, error, stackTrace) {
              return const Icon(Icons.person, size: 30, color: AppColors.primary);
            },
          ),
        ),
      );
    }

    return CircleAvatar(
      radius: 30,
      backgroundColor: AppColors.primary.withValues(alpha: 0.1),
      child: const Icon(Icons.person, size: 30, color: AppColors.primary),
    );
  }

  void _showAdvancedFilterDialog() {
    // Initialize temp values with current values
    _tempSort = _currentSort;
    _tempFilter = _currentFilter;
    _tempSelectedSkills.clear();
    _tempSelectedSkills.addAll(_selectedSkills);
    _tempSelectedLanguages.clear();
    _tempSelectedLanguages.addAll(_selectedLanguages);
    _tempMinExperience = _minExperience;
    _tempMaxExperience = _maxExperience;
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Container(
            constraints: BoxConstraints(
              maxHeight: MediaQuery.of(context).size.height * 0.8,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header with title and close button
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(16),
                      topRight: Radius.circular(16),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Filters & Sort',
                          style: TextStyle(
                            color: AppColors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: AppColors.white),
                        onPressed: () => Navigator.pop(context),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                ),
                
                // Content
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Search Section
                        Text('Search', style: TextStyle(
                          fontWeight: FontWeight.bold, 
                          fontSize: 16,
                          color: AppColors.textPrimary,
                        )),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _searchController,
                          decoration: InputDecoration(
                            hintText: 'Search by name, skills, languages...',
                            prefixIcon: const Icon(Icons.search, color: AppColors.primary),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: AppColors.grey300),
                            ),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          ),
                        ),
                        
                        const SizedBox(height: 15),
                        
                        // Sort Section
                        Text('Sort By', style: TextStyle(
                          fontWeight: FontWeight.bold, 
                          fontSize: 16,
                          color: AppColors.textPrimary,
                        )),
                        const SizedBox(height: 5),
                        Column(
                          children: [
                            _buildSortRadioTile('Name (A-Z)', SortBy.name, setDialogState),
                            _buildSortRadioTile('Chat Rate (Low to High)', SortBy.chatRate, setDialogState),
                            _buildSortRadioTile('Call Rate (Low to High)', SortBy.callRate, setDialogState),
                            _buildSortRadioTile('Rating (High to Low)', SortBy.rating, setDialogState),
                            _buildSortRadioTile('Experience (High to Low)', SortBy.experience, setDialogState),
                          ],
                        ),
                        
                        const SizedBox(height: 15),
                        
                        // Availability Filter
                        Text('Availability', style: TextStyle(
                          fontWeight: FontWeight.bold, 
                          fontSize: 16,
                          color: AppColors.textPrimary,
                        )),
                        const SizedBox(height: 5),
                        Column(
                          children: [
                            _buildFilterRadioTile('All', FilterBy.all, setDialogState),
                            _buildFilterRadioTile('Online Only', FilterBy.online, setDialogState),
                            _buildFilterRadioTile('Offline Only', FilterBy.offline, setDialogState),
                          ],
                        ),
                        
                        const SizedBox(height: 15),
                        
                        // Skills Filter with Toggle Switches
                        Text('Skills (${_availableSkills.length})', style: TextStyle(
                          fontWeight: FontWeight.bold, 
                          fontSize: 16,
                          color: AppColors.textPrimary,
                        )),
                        const SizedBox(height: 5),
                        if (_availableSkills.isEmpty)
                          Text('Loading skills...', style: TextStyle(color: AppColors.textSecondary))
                        else
                          ..._availableSkills.map((skill) => _buildSkillToggleTile(skill, setDialogState)),
                        
                        const SizedBox(height: 15),
                        
                        // Languages Filter with Toggle Switches
                        Text('Languages (${_availableLanguages.length})', style: TextStyle(
                          fontWeight: FontWeight.bold, 
                          fontSize: 16,
                          color: AppColors.textPrimary,
                        )),
                        const SizedBox(height: 5),
                        if (_availableLanguages.isEmpty)
                          Text('Loading languages...', style: TextStyle(color: AppColors.textSecondary))
                        else
                          ..._availableLanguages.map((language) => _buildLanguageToggleTile(language, setDialogState)),
                        
                        const SizedBox(height: 15),
                        
                        // Experience Range
                        Text('Experience Range', style: TextStyle(
                          fontWeight: FontWeight.bold, 
                          fontSize: 16,
                          color: AppColors.textPrimary,
                        )),
                        const SizedBox(height: 8),
                        Text(
                          '${_tempMinExperience.toInt()} - ${_tempMaxExperience.toInt()} years',
                          style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 8),
                        RangeSlider(
                          values: RangeValues(_tempMinExperience, _tempMaxExperience),
                          min: 0,
                          max: 50,
                          divisions: 25,
                          // ignore: deprecated_member_use
              activeColor: AppColors.primary,
                          inactiveColor: AppColors.grey300,
                          labels: RangeLabels(
                            '${_tempMinExperience.toInt()}',
                            '${_tempMaxExperience.toInt()}',
                          ),
                          onChanged: (values) => setDialogState(() {
                            _tempMinExperience = values.start;
                            _tempMaxExperience = values.end;
                          }),
                        ),
                      ],
                    ),
                  ),
                ),
                
                // Action buttons
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                  decoration: BoxDecoration(
                    color: AppColors.grey100,
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(16),
                      bottomRight: Radius.circular(16),
                    ),
                  ),
                  child: Column(
                    children: [
                      // Cancel and Apply buttons in a row
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                setDialogState(() {
                                  _tempSort = SortBy.name;
                                  _tempFilter = FilterBy.all;
                                  _tempSelectedSkills.clear();
                                  _tempSelectedLanguages.clear();
                                  _tempMinExperience = 0;
                                  _tempMaxExperience = 50;
                                });
                                setState(() {
                                  _currentSort = SortBy.name;
                                  _currentFilter = FilterBy.all;
                                  _selectedSkills.clear();
                                  _selectedLanguages.clear();
                                  _minExperience = 0;
                                  _maxExperience = 50;
                                  _currentOffset = 0;
                                  _hasMore = true;
                                });
                                _searchController.clear();
                                Navigator.pop(context);
                                // Reload from beginning without filters
                                _loadAstrologers(refresh: true);
                              },
                              style: OutlinedButton.styleFrom(
                                foregroundColor: AppColors.primary,
                                side: BorderSide(color: AppColors.primary),
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child: const Text('Clear', style: TextStyle(fontWeight: FontWeight.w600)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () {
                                setState(() {
                                  _currentSort = _tempSort;
                                  _currentFilter = _tempFilter;
                                  _selectedSkills.clear();
                                  _selectedSkills.addAll(_tempSelectedSkills);
                                  _selectedLanguages.clear();
                                  _selectedLanguages.addAll(_tempSelectedLanguages);
                                  _minExperience = _tempMinExperience;
                                  _maxExperience = _tempMaxExperience;
                                  // Reset pagination when filters change
                                  _currentOffset = 0;
                                  _hasMore = true;
                                });
                                Navigator.pop(context);
                                // Reload from beginning with new filters
                                _loadAstrologers(refresh: true);
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: AppColors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              child: const Text('Apply', style: TextStyle(fontWeight: FontWeight.w600)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSortRadioTile(String title, SortBy sortBy, StateSetter setDialogState) {
    return InkWell(
      onTap: () => setDialogState(() => _tempSort = sortBy),
      child: Container(
        padding: const EdgeInsets.fromLTRB(0, 1, 4, 1),
        child: Row(
          children: [
            // ignore: deprecated_member_use
            Radio<SortBy>(
              value: sortBy,
              // ignore: deprecated_member_use
              groupValue: _tempSort,
              // ignore: deprecated_member_use
              onChanged: (value) => setDialogState(() => _tempSort = value!),
              // ignore: deprecated_member_use
              activeColor: AppColors.primary,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                title, 
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildFilterRadioTile(String title, FilterBy filterBy, StateSetter setDialogState) {
    return InkWell(
      onTap: () => setDialogState(() => _tempFilter = filterBy),
      child: Container(
        padding: const EdgeInsets.fromLTRB(0, 1, 4, 1),
        child: Row(
          children: [
            // ignore: deprecated_member_use
            Radio<FilterBy>(
              value: filterBy,
              // ignore: deprecated_member_use
              groupValue: _tempFilter,
              // ignore: deprecated_member_use
              onChanged: (value) => setDialogState(() => _tempFilter = value!),
              // ignore: deprecated_member_use
              activeColor: AppColors.primary,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.textPrimary,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSkillToggleTile(String skill, StateSetter setDialogState) {
    final isSelected = _tempSelectedSkills.contains(skill);
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              skill,
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          Transform.scale(
            scale: 0.8,
            child: Switch(
              value: isSelected,
              onChanged: (value) => setDialogState(() {
                if (value) {
                  _tempSelectedSkills.add(skill);
                } else {
                  _tempSelectedSkills.remove(skill);
                }
              }),
              // ignore: deprecated_member_use
              activeColor: AppColors.primary,
              activeTrackColor: AppColors.primary.withValues(alpha: 0.3),
              inactiveThumbColor: AppColors.grey400,
              inactiveTrackColor: AppColors.grey300,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageToggleTile(String language, StateSetter setDialogState) {
    final isSelected = _tempSelectedLanguages.contains(language);
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              language,
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          Transform.scale(
            scale: 0.8,
            child: Switch(
              value: isSelected,
              onChanged: (value) => setDialogState(() {
                if (value) {
                  _tempSelectedLanguages.add(language);
                } else {
                  _tempSelectedLanguages.remove(language);
                }
              }),
              // ignore: deprecated_member_use
              activeColor: AppColors.primary,
              activeTrackColor: AppColors.primary.withValues(alpha: 0.3),
              inactiveThumbColor: AppColors.grey400,
              inactiveTrackColor: AppColors.grey300,
            ),
          ),
        ],
      ),
    );
  }

}