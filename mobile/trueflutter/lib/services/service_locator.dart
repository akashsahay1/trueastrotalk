import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'api/user_api_service.dart';
import 'auth/auth_service.dart';
import 'network/dio_client.dart';
import 'local/local_storage_service.dart';
import 'cart_service.dart';
import 'payment/razorpay_service.dart';
import 'email/email_service.dart';
import 'socket/socket_service.dart';
import 'chat/chat_service.dart';
import 'call/call_service.dart';

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

  // Register Cart service
  getIt.registerSingleton<CartService>(
    CartService(getIt<LocalStorageService>()),
  );

  // Register Razorpay service
  getIt.registerSingleton<RazorpayService>(
    RazorpayService.instance,
  );

  // Register Email service
  getIt.registerSingleton<EmailService>(
    EmailService.instance,
  );

  // Register Socket service
  getIt.registerSingleton<SocketService>(
    SocketService.instance,
  );

  // Register Chat service
  getIt.registerSingleton<ChatService>(
    ChatService.instance,
  );

  // Register Call service
  getIt.registerSingleton<CallService>(
    CallService.instance,
  );
}