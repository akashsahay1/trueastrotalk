import 'dart:convert';

void main() {
  // Latest JWT token from our login response
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGE4YzBjZjc2NzZhYjgwYzNmYWQwZjYiLCJlbWFpbCI6ImFzdHJvMUB0cnVlYXN0cm90YWxrLmNvbSIsImZ1bGxfbmFtZSI6IkRyLiBSYWplc2ggU2hhcm1hIiwidXNlcl90eXBlIjoiYXN0cm9sb2dlciIsImFjY291bnRfc3RhdHVzIjoiYWN0aXZlIiwic2Vzc2lvbl9pZCI6ImRiM2YyOWU2LWU2ODgtNDFiZC1iMjQxLTQzMzJhNWRmYzQwYSIsImlhdCI6MTc1NTg5MTQ1NywiZXhwIjoxNzU1ODk1MDU3LCJhdWQiOiJ0cnVlYXN0cm90YWxrLWFwcCIsImlzcyI6InRydWVhc3Ryb3RhbGstYXBpIn0.P6kcD5CxlWlJcsGuoVumJYisO4xuThQRDf0Iv6H3ybA';
  
  // Split the token into parts
  final parts = token.split('.');
  if (parts.length != 3) {
    print('Invalid JWT token format');
    return;
  }
  
  // Decode the payload (second part)
  final payload = parts[1];
  
  // Add padding if needed
  String padded = payload;
  while (padded.length % 4 != 0) {
    padded += '=';
  }
  
  try {
    final decoded = base64Url.decode(padded);
    final jsonString = utf8.decode(decoded);
    final payloadMap = jsonDecode(jsonString);
    
    print('Current JWT Token Payload:');
    payloadMap.forEach((key, value) {
      print('  $key: $value');
    });
    
    print('\nChecking specific fields that Socket.IO needs:');
    print('  userId: ${payloadMap['userId']}');
    print('  user_type: ${payloadMap['user_type']}');
    
    // Convert timestamps
    if (payloadMap['exp'] != null) {
      final expiry = DateTime.fromMillisecondsSinceEpoch(payloadMap['exp'] * 1000);
      print('  Token expires at: $expiry');
      print('  Is token expired: ${DateTime.now().isAfter(expiry)}');
    }
  } catch (e) {
    print('Error decoding JWT: $e');
  }
}