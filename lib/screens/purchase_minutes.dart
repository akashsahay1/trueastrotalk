import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/user.dart';
import '../models/session.dart';
import '../services/sessions.dart';

class PurchaseMinutesScreen extends StatefulWidget {
  final User astrologer;

  const PurchaseMinutesScreen({
    Key? key,
    required this.astrologer,
  }) : super(key: key);

  @override
  PurchaseMinutesScreenState createState() => PurchaseMinutesScreenState();
}

class PurchaseMinutesScreenState extends State<PurchaseMinutesScreen> {
  final List<Map<String, dynamic>> _packages = [
    {'minutes': 10, 'price': 199},
    {'minutes': 20, 'price': 349},
    {'minutes': 30, 'price': 499},
    {'minutes': 60, 'price': 899},
  ];

  int _selectedPackageIndex = 0;
  bool _isLoading = false;
  AstrologerSession? _activeSession;

  @override
  void initState() {
    super.initState();
    _checkActiveSession();
  }

  Future<void> _checkActiveSession() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final sessionService = Provider.of<SessionService>(context, listen: false);
      _activeSession = await sessionService.getActiveSessionForAstrologer(widget.astrologer.ID);
    } catch (e) {
      print('Error checking active session: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _purchasePackage() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final sessionService = Provider.of<SessionService>(context, listen: false);
      final package = _packages[_selectedPackageIndex];

      final session = await sessionService.purchaseSession(
        widget.astrologer.ID,
        package['minutes'],
        package['price'].toDouble(),
      );

      if (!mounted) return;

      setState(() {
        _activeSession = session;
      });

      // Show success message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Successfully purchased ${package['minutes']} minutes!'),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.pop(context, true); // Return true to indicate successful purchase
    } catch (e) {
      if (!mounted) return;

      // Show error message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to purchase package: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Purchase Call Minutes'),
        backgroundColor: Theme.of(context).colorScheme.primaryContainer,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Astrologer info
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 30,
                          backgroundImage: NetworkImage(widget.astrologer.userAvatar.toString()),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${widget.astrologer.firstName} ${widget.astrologer.lastName}',
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              widget.astrologer.userExperience.toString(),
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey[600],
                              ),
                            ),
                            Text(
                              'Rate: ₹${widget.astrologer.astroCharges}/min',
                              style: TextStyle(
                                fontSize: 14,
                                color: Theme.of(context).colorScheme.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Active session info (if any)
                    if (_activeSession != null)
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.green.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.green),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(Icons.access_time, color: Colors.green[700]),
                                const SizedBox(width: 8),
                                Text(
                                  'You have an active session',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green[700],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Remaining time: ${_activeSession!.remainingMinutes} minutes',
                              style: const TextStyle(fontSize: 15),
                            ),
                            Text(
                              'Valid until: ${_activeSession!.expiresAt.toLocal().toString().split('.')[0]}',
                              style: const TextStyle(fontSize: 15),
                            ),
                            const SizedBox(height: 12),
                            ElevatedButton.icon(
                              onPressed: () {
                                Navigator.pop(context, true); // Return to previous screen
                              },
                              icon: const Icon(Icons.call),
                              label: const Text('Call Now'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green,
                                foregroundColor: Colors.white,
                                minimumSize: const Size(double.infinity, 45),
                              ),
                            ),
                          ],
                        ),
                      ),

                    const SizedBox(height: 24),

                    const Text(
                      'Select a Package',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Packages list
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _packages.length,
                      itemBuilder: (context, index) {
                        final package = _packages[index];
                        final isSelected = _selectedPackageIndex == index;

                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              _selectedPackageIndex = index;
                            });
                          },
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isSelected ? Theme.of(context).colorScheme.primaryContainer : Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: isSelected ? Theme.of(context).colorScheme.primary : Colors.grey.shade300,
                                width: isSelected ? 2 : 1,
                              ),
                              boxShadow: [
                                if (isSelected)
                                  BoxShadow(
                                    color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
                                    blurRadius: 8,
                                    spreadRadius: 1,
                                  ),
                              ],
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${package['minutes']} Minutes',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                      ),
                                    ),
                                    if (package['minutes'] >= 30)
                                      Text(
                                        'Best Value',
                                        style: TextStyle(
                                          color: Colors.green[700],
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                  ],
                                ),
                                Text(
                                  '₹${package['price']}',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: isSelected ? Theme.of(context).colorScheme.primary : Colors.black,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 32),

                    // Purchase button
                    if (_activeSession == null)
                      ElevatedButton(
                        onPressed: _isLoading ? null : _purchasePackage,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).colorScheme.primary,
                          foregroundColor: Colors.black,
                          minimumSize: const Size(double.infinity, 50),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator()
                            : const Text(
                                'Purchase Package',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                  ],
                ),
              ),
            ),
    );
  }
}
