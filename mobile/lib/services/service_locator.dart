import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'api/user_api_service.dart';
import 'auth/auth_service.dart';
import 'network/dio_client.dart';

final GetIt getIt = GetIt.instance;

void setupServiceLocator() {
  // Initialize the properly configured DioClient first
  DioClient.initialize();
  
  // Register the properly configured Dio instance
  getIt.registerSingleton<Dio>(DioClient.instance);

  // Register API services
  getIt.registerSingleton<UserApiService>(
    UserApiService(getIt<Dio>()),
  );

  // Register Auth service
  getIt.registerSingleton<AuthService>(
    AuthService(getIt<UserApiService>()),
  );
}