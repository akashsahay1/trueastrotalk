import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'api/user_api_service.dart';
import 'auth/auth_service.dart';
import 'network/dio_client.dart';
import 'local/local_storage_service.dart';

final GetIt getIt = GetIt.instance;

void setupServiceLocator() {
  // Register the already initialized Dio instance (initialized in main.dart)
  getIt.registerSingleton<Dio>(DioClient.instance);

  // Register Local Storage service (needs to be initialized in main.dart)
  getIt.registerSingleton<LocalStorageService>(LocalStorageService());

  // Register API services
  getIt.registerSingleton<UserApiService>(
    UserApiService(getIt<Dio>(), getIt<LocalStorageService>()),
  );

  // Register Auth service
  getIt.registerSingleton<AuthService>(
    AuthService(getIt<UserApiService>()),
  );
}