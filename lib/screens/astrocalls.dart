import 'package:flutter/material.dart';
import 'package:trueastrotalk/common/astrocard.dart';
import 'package:trueastrotalk/models/user.dart';
import 'package:trueastrotalk/services/userservice.dart';

class Astrocalls extends StatefulWidget {
  const Astrocalls({super.key});

  @override
  State<Astrocalls> createState() => _AstrologersState();
}

class _AstrologersState extends State<Astrocalls> {
  final UserService _userService = UserService();
  List<User> _astrologers = [];
  bool _isLoading = true;
  bool _hasMore = true;
  int _currentPage = 1;
  final int _perPage = 15;
  bool _isLoadingMore = false;

  @override
  void initState() {
    super.initState();
    _loadAstrologers();
  }

  Future<void> _loadAstrologers() async {
    setState(() {
      _isLoading = true;
    });

    try {
      // Load initial astrologers
      final astrologers = await _userService.getAstrologers(limit: _perPage, page: 1);
      final currentUserId = await _userService.getCurrentUserID();

      final filteredAstrologers = astrologers.where((user) => user.ID != currentUserId).toList();

      // Get pagination info to know if there are more astrologers
      final pagination = await _userService.getAstrologersPagination(limit: _perPage, page: 1);

      setState(() {
        _astrologers = filteredAstrologers;
        _hasMore = pagination['has_more'];
        _currentPage = 1;
      });
    } catch (e) {
      // Handle error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to load astrologers: ${e.toString()}')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMoreAstrologers() async {
    if (_isLoadingMore || !_hasMore) return;

    setState(() {
      _isLoadingMore = true;
    });

    try {
      // Load more astrologers
      final nextPage = _currentPage + 1;
      final moreAstrologers = await _userService.getAstrologers(limit: _perPage, page: nextPage);
      final currentUserId = await _userService.getCurrentUserID();

      final filteredMoreAstrologers = moreAstrologers.where((user) => user.ID != currentUserId).toList();

      // Get updated pagination info
      final pagination = await _userService.getAstrologersPagination(limit: _perPage, page: nextPage);

      setState(() {
        if (filteredMoreAstrologers.isNotEmpty) {
          _astrologers.addAll(filteredMoreAstrologers);
          _currentPage = nextPage;
        }
        _hasMore = pagination['has_more'];
      });
    } catch (e) {
      // Handle error
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load more astrologers: ${e.toString()}')),
        );
    } finally {
      if (mounted)
        setState(() {
          _isLoadingMore = false;
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    return _isLoading ? Center(child: CircularProgressIndicator(color: Colors.black)) : _buildAstrologersList();
  }

  Widget _buildAstrologersList() {
    if (_astrologers.isEmpty) {
      return Center(
        child: Text('No astrologers available at the moment.'),
      );
    }

    return NotificationListener<ScrollNotification>(
      onNotification: (ScrollNotification scrollInfo) {
        if (scrollInfo.metrics.pixels == scrollInfo.metrics.maxScrollExtent && _hasMore && !_isLoadingMore) {
          _loadMoreAstrologers();
        }
        return true;
      },
      child: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.all(8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ListView.builder(
                shrinkWrap: true,
                physics: NeverScrollableScrollPhysics(),
                itemCount: _astrologers.length + (_hasMore ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _astrologers.length) {
                    return _buildLoadingIndicator();
                  }
                  return AstrologerCard(
                    astrologer: _astrologers[index],
                    cardType: "call",
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingIndicator() {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 16),
      alignment: Alignment.center,
      child: CircularProgressIndicator(
        valueColor: AlwaysStoppedAnimation<Color>(Colors.black),
      ),
    );
  }
}
