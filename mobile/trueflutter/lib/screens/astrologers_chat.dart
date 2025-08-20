import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../common/themes/app_colors.dart';
import '../common/themes/text_styles.dart';
import '../common/widgets/astrologer_chat_card.dart';
import '../services/api/user_api_service.dart';
import '../models/astrologer.dart';

enum SortBy { name, chatRate, rating, experience }
enum FilterBy { all, online, offline }

class AstrologersChatScreen extends StatefulWidget {
  final UserApiService userApiService;
  final Function(Astrologer) onAstrologerTap;
  final Function(Astrologer) onStartChat;

  const AstrologersChatScreen({
    super.key,
    required this.userApiService,
    required this.onAstrologerTap,
    required this.onStartChat,
  });

  @override
  State<AstrologersChatScreen> createState() => _AstrologersChatScreenState();
}

class _AstrologersChatScreenState extends State<AstrologersChatScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  Timer? _searchDebounce;
  
  List<Astrologer> _allAstrologers = [];
  List<Astrologer> _filteredAstrologers = [];
  bool _isLoading = true;
  bool _isLoadingMore = false;
  
  // Filter and sort state
  SortBy _currentSort = SortBy.chatRate;
  FilterBy _currentFilter = FilterBy.all;
  String _searchQuery = '';
  final Set<String> _selectedSkills = {};
  final Set<String> _selectedLanguages = {};
  double _minExperience = 0;
  double _maxExperience = 50;
  
  // Temporary filter state for dialog
  SortBy _tempSort = SortBy.chatRate;
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
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 500), () {
      setState(() {
        _searchQuery = _searchController.text;
        _currentOffset = 0;
        _hasMore = true;
      });
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
      
      if (_availableSkills.isEmpty || _availableLanguages.isEmpty) {
        final options = await widget.userApiService.getAstrologerOptions();
        setState(() {
          _availableSkills = options['skills'] ?? [];
          _availableLanguages = options['languages'] ?? [];
        });
        
        await prefs.setStringList('astrologer_skills', _availableSkills);
        await prefs.setStringList('astrologer_languages', _availableLanguages);
      }
    } catch (e) {
      // Handle error silently
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

    // Apply sorting - default to chat rate for chat screen
    switch (_currentSort) {
      case SortBy.name:
        filtered.sort((a, b) => a.fullName.compareTo(b.fullName));
        break;
      case SortBy.chatRate:
        filtered.sort((a, b) => a.chatRate.compareTo(b.chatRate));
        break;
      case SortBy.rating:
        filtered.sort((a, b) => b.rating.compareTo(a.rating));
        break;
      case SortBy.experience:
        filtered.sort((a, b) => b.experienceYears.compareTo(a.experienceYears));
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
        title: Text('Chat with Astrologers', style: AppTextStyles.heading4.copyWith(color: AppColors.white)),
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
          _buildSearchBar(),
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

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: 'Search astrologers by name, skill or language...',
          hintStyle: TextStyle(color: AppColors.textSecondary),
          prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                  },
                )
              : null,
          filled: true,
          fillColor: AppColors.grey100,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.person_search, size: 80, color: AppColors.grey400),
          const SizedBox(height: 16),
          Text(
            'No astrologers found',
            style: AppTextStyles.heading5.copyWith(color: AppColors.textPrimary),
          ),
          const SizedBox(height: 8),
          Text(
            'Try adjusting your filters or search',
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
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
            child: AstrologerChatCard(
              astrologer: astrologer,
              onTap: () => widget.onAstrologerTap(astrologer),
              onStartChat: () => widget.onStartChat(astrologer),
            ),
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


  void _showAdvancedFilterDialog() {
    // Copy current filters to temp
    _tempSort = _currentSort;
    _tempFilter = _currentFilter;
    _tempSelectedSkills.clear();
    _tempSelectedSkills.addAll(_selectedSkills);
    _tempSelectedLanguages.clear();
    _tempSelectedLanguages.addAll(_tempSelectedLanguages);
    _tempMinExperience = _minExperience;
    _tempMaxExperience = _maxExperience;
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Container(
            constraints: const BoxConstraints(maxHeight: 600),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(16),
                      topRight: Radius.circular(16),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.tune, color: AppColors.white),
                      const SizedBox(width: 8),
                      Text(
                        'Filter & Sort',
                        style: AppTextStyles.heading5.copyWith(color: AppColors.white),
                      ),
                    ],
                  ),
                ),
                
                // Content
                Flexible(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Sort Section
                        Text('Sort By', style: TextStyle(
                          fontWeight: FontWeight.bold, 
                          fontSize: 16,
                          color: AppColors.textPrimary,
                        )),
                        const SizedBox(height: 8),
                        _buildSortOption('Name (A-Z)', SortBy.name, setDialogState),
                        _buildSortOption('Chat Rate (Low to High)', SortBy.chatRate, setDialogState),
                        _buildSortOption('Rating (High to Low)', SortBy.rating, setDialogState),
                        _buildSortOption('Experience (High to Low)', SortBy.experience, setDialogState),
                        
                        const SizedBox(height: 16),
                        
                        // Availability Filter
                        Text('Availability', style: TextStyle(
                          fontWeight: FontWeight.bold, 
                          fontSize: 16,
                          color: AppColors.textPrimary,
                        )),
                        const SizedBox(height: 8),
                        _buildFilterOption('All', FilterBy.all, setDialogState),
                        _buildFilterOption('Online Only', FilterBy.online, setDialogState),
                        _buildFilterOption('Offline Only', FilterBy.offline, setDialogState),
                        
                        const SizedBox(height: 16),
                        
                        // Experience Range
                        Text('Experience', style: TextStyle(
                          fontWeight: FontWeight.bold, 
                          fontSize: 16,
                          color: AppColors.textPrimary,
                        )),
                        const SizedBox(height: 8),
                        Text(
                          '${_tempMinExperience.toInt()} - ${_tempMaxExperience.toInt()} years',
                          style: TextStyle(color: AppColors.primary),
                        ),
                        RangeSlider(
                          values: RangeValues(_tempMinExperience, _tempMaxExperience),
                          min: 0,
                          max: 50,
                          divisions: 25,
                          activeColor: AppColors.primary,
                          inactiveColor: AppColors.grey300,
                          labels: RangeLabels(
                            _tempMinExperience.toInt().toString(),
                            _tempMaxExperience.toInt().toString(),
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
                
                // Actions
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.grey100,
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(16),
                      bottomRight: Radius.circular(16),
                    ),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            setDialogState(() {
                              _tempSort = SortBy.chatRate;
                              _tempFilter = FilterBy.all;
                              _tempSelectedSkills.clear();
                              _tempSelectedLanguages.clear();
                              _tempMinExperience = 0;
                              _tempMaxExperience = 50;
                            });
                            setState(() {
                              _currentSort = SortBy.chatRate;
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
                          child: const Text('Clear'),
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
                              _currentOffset = 0;
                              _hasMore = true;
                            });
                            Navigator.pop(context);
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
                          child: const Text('Apply'),
                        ),
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

  Widget _buildSortOption(String title, SortBy value, StateSetter setDialogState) {
    return RadioListTile<SortBy>(
      title: Text(title),
      value: value,
      // ignore: deprecated_member_use
      groupValue: _tempSort,
      // ignore: deprecated_member_use
      onChanged: (val) => setDialogState(() => _tempSort = val!),
      contentPadding: EdgeInsets.zero,
      dense: true,
    );
  }

  Widget _buildFilterOption(String title, FilterBy value, StateSetter setDialogState) {
    return RadioListTile<FilterBy>(
      title: Text(title),
      value: value,
      // ignore: deprecated_member_use
      groupValue: _tempFilter,
      // ignore: deprecated_member_use
      onChanged: (val) => setDialogState(() => _tempFilter = val!),
      contentPadding: EdgeInsets.zero,
      dense: true,
    );
  }
}