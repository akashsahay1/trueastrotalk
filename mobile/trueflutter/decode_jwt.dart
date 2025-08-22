import 'dart:convert';

void main() {
  // Sample JWT token from our login response
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGE4YzBjZjc2NzZhYjgwYzNmYWQwZjYiLCJlbWFpbCI6ImFzdHJvMUB0cnVlYXN0cm90YWxrLmNvbSIsImZ1bGxfbmFtZSI6IkRyLiBSYWplc2ggU2hhcm1hIiwidXNlcl90eXBlIjoiYXN0cm9sb2dlciIsImFjY291bnRfc3RhdHVzIjoiYWN0aXZlIiwic2Vzc2lvbl9pZCI6IjkxNjgzOTQwLThjNDctNDA0Yy1hOWU0LTRkMGE0ZjMxOGFlOSIsImlhdCI6MTc1NTg5MTE3OCwiZXhwIjoxNzU1ODk0Nzc4LCJhdWQiOiJ0cnVlYXN0cm90YWxrLWFwcCIsImlzcyI6InRydWVhc3Ryb3RhbGstYXBpIn0.G76sVzzuCLZ6Pd6CEFSt07f_mVr6Cqiijy2nLkA44WY';
  
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
    
    print('JWT Token Payload:');
    payloadMap.forEach((key, value) {
      print('  $key: $value');
    });
  } catch (e) {
    print('Error decoding JWT: $e');
  }
}