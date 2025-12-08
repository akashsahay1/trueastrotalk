import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Billing Calculations', () {
    group('Chat billing', () {
      test('should calculate chat cost correctly for whole minutes', () {
        const ratePerMinute = 10.0;
        const durationMinutes = 5;
        
        final cost = calculateChatCost(ratePerMinute, durationMinutes);
        
        expect(cost, 50.0);
      });

      test('should calculate chat cost for decimal minutes', () {
        const ratePerMinute = 12.5;
        const durationMinutes = 8;
        
        final cost = calculateChatCost(ratePerMinute, durationMinutes);
        
        expect(cost, 100.0);
      });

      test('should handle zero duration', () {
        const ratePerMinute = 10.0;
        const durationMinutes = 0;
        
        final cost = calculateChatCost(ratePerMinute, durationMinutes);
        
        expect(cost, 0.0);
      });

      test('should calculate minimum chat amount', () {
        const ratePerMinute = 15.0;
        const minimumMinutes = 5;
        
        final minimumCost = calculateMinimumChatCost(ratePerMinute, minimumMinutes);
        
        expect(minimumCost, 75.0);
      });
    });

    group('Call billing', () {
      test('should calculate call cost correctly', () {
        const ratePerMinute = 20.0;
        const durationMinutes = 3;
        
        final cost = calculateCallCost(ratePerMinute, durationMinutes);
        
        expect(cost, 60.0);
      });

      test('should calculate minimum call amount', () {
        const ratePerMinute = 25.0;
        const minimumMinutes = 5;
        
        final minimumCost = calculateMinimumCallCost(ratePerMinute, minimumMinutes);
        
        expect(minimumCost, 125.0);
      });

      test('should handle fractional rates and durations', () {
        const ratePerMinute = 12.50;
        const durationMinutes = 7;
        
        final cost = calculateCallCost(ratePerMinute, durationMinutes);
        
        expect(cost, 87.5);
      });
    });

    group('Balance validation', () {
      test('should validate sufficient balance', () {
        const currentBalance = 100.0;
        const requiredAmount = 75.0;
        
        final hasSufficient = hasSufficientBalance(currentBalance, requiredAmount);
        
        expect(hasSufficient, true);
      });

      test('should detect insufficient balance', () {
        const currentBalance = 50.0;
        const requiredAmount = 75.0;
        
        final hasSufficient = hasSufficientBalance(currentBalance, requiredAmount);
        
        expect(hasSufficient, false);
      });

      test('should handle exact balance match', () {
        const currentBalance = 75.0;
        const requiredAmount = 75.0;
        
        final hasSufficient = hasSufficientBalance(currentBalance, requiredAmount);
        
        expect(hasSufficient, true);
      });

      test('should handle zero balance', () {
        const currentBalance = 0.0;
        const requiredAmount = 10.0;
        
        final hasSufficient = hasSufficientBalance(currentBalance, requiredAmount);
        
        expect(hasSufficient, false);
      });
    });

    group('Balance formatting', () {
      test('should format currency with rupee symbol', () {
        const amount = 1234.56;
        
        final formatted = formatCurrency(amount);
        
        expect(formatted, '₹1,234.56');
      });

      test('should format zero amount', () {
        const amount = 0.0;
        
        final formatted = formatCurrency(amount);
        
        expect(formatted, '₹0.00');
      });

      test('should format large amounts with commas', () {
        const amount = 123456.78;
        
        final formatted = formatCurrency(amount);
        
        expect(formatted, '₹1,23,456.78');
      });

      test('should handle whole numbers', () {
        const amount = 100.0;
        
        final formatted = formatCurrency(amount);
        
        expect(formatted, '₹100.00');
      });

      test('should handle small decimals', () {
        const amount = 5.5;
        
        final formatted = formatCurrency(amount);
        
        expect(formatted, '₹5.50');
      });
    });

    group('Duration formatting', () {
      test('should format minutes and seconds', () {
        const totalSeconds = 125; // 2 minutes 5 seconds
        
        final formatted = formatDuration(totalSeconds);
        
        expect(formatted, '02:05');
      });

      test('should format hours, minutes and seconds', () {
        const totalSeconds = 3665; // 1 hour 1 minute 5 seconds
        
        final formatted = formatDuration(totalSeconds);
        
        expect(formatted, '01:01:05');
      });

      test('should handle zero duration', () {
        const totalSeconds = 0;
        
        final formatted = formatDuration(totalSeconds);
        
        expect(formatted, '00:00');
      });

      test('should handle exact minutes', () {
        const totalSeconds = 300; // 5 minutes
        
        final formatted = formatDuration(totalSeconds);
        
        expect(formatted, '05:00');
      });
    });

    group('Low balance warnings', () {
      test('should identify low balance correctly', () {
        const balance = 25.0;
        const threshold = 50.0;
        
        final isLow = isLowBalance(balance, threshold);
        
        expect(isLow, true);
      });

      test('should identify sufficient balance', () {
        const balance = 75.0;
        const threshold = 50.0;
        
        final isLow = isLowBalance(balance, threshold);
        
        expect(isLow, false);
      });

      test('should handle edge case at threshold', () {
        const balance = 50.0;
        const threshold = 50.0;
        
        final isLow = isLowBalance(balance, threshold);
        
        expect(isLow, false);
      });
    });
  });
}

// Helper functions for billing calculations
double calculateChatCost(double ratePerMinute, int durationMinutes) {
  return ratePerMinute * durationMinutes;
}

double calculateCallCost(double ratePerMinute, int durationMinutes) {
  return ratePerMinute * durationMinutes;
}

double calculateMinimumChatCost(double ratePerMinute, int minimumMinutes) {
  return ratePerMinute * minimumMinutes;
}

double calculateMinimumCallCost(double ratePerMinute, int minimumMinutes) {
  return ratePerMinute * minimumMinutes;
}

bool hasSufficientBalance(double currentBalance, double requiredAmount) {
  return currentBalance >= requiredAmount;
}

String formatCurrency(double amount) {
  // Simple formatting - in real implementation would use NumberFormat
  final parts = amount.toStringAsFixed(2).split('.');
  final integerPart = parts[0];
  final decimalPart = parts[1];
  
  // Add commas for thousands (simplified Indian number format)
  final formatted = _addCommas(integerPart);
  return '₹$formatted.$decimalPart';
}

String _addCommas(String number) {
  if (number.length <= 3) return number;
  
  // Indian numbering system: first comma after 3 digits from right, then every 2 digits
  final reversed = number.split('').reversed.toList();
  final result = <String>[];
  
  for (int i = 0; i < reversed.length; i++) {
    if (i == 3 || (i > 3 && (i - 3) % 2 == 0)) {
      result.add(',');
    }
    result.add(reversed[i]);
  }
  
  return result.reversed.join('');
}

String formatDuration(int totalSeconds) {
  final hours = totalSeconds ~/ 3600;
  final minutes = (totalSeconds % 3600) ~/ 60;
  final seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  } else {
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}

bool isLowBalance(double balance, double threshold) {
  return balance < threshold;
}