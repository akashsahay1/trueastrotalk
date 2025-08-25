import 'package:flutter_driver/driver_extension.dart';
import 'package:mobile/main.dart' as app;

void main() {
  // Enable integration testing
  enableFlutterDriverExtension();
  
  // Call the main function of the app
  app.main();
}