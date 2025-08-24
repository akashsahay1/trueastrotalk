import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'api/user_api_service.dart';
import 'api/products_api_service.dart';
import 'api/cart_api_service.dart';
import 'api/orders_api_service.dart';
import 'api/addresses_api_service.dart';
import 'api/chat_api_service.dart';
import 'api/calls_api_service.dart';
import 'api/notifications_api_service.dart';
import 'api/reviews_api_service.dart';
import 'auth/auth_service.dart';
import 'network/dio_client.dart';
import 'local/local_storage_service.dart';
import 'cart_service.dart';
import 'payment/razorpay_service.dart';
import 'email/email_service.dart';
import 'socket/socket_service.dart';
import 'webrtc/webrtc_service.dart';
import 'network/network_diagnostics_service.dart';
import 'chat/chat_service.dart';
import 'call/call_service.dart';
import 'wallet/wallet_service.dart';
import 'notifications/notification_service.dart';

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

  getIt.registerSingleton<ProductsApiService>(
    ProductsApiService(getIt<Dio>()),
  );

  getIt.registerSingleton<CartApiService>(
    CartApiService(getIt<Dio>()),
  );

  getIt.registerSingleton<OrdersApiService>(
    OrdersApiService(getIt<Dio>()),
  );

  getIt.registerSingleton<AddressesApiService>(
    AddressesApiService(getIt<Dio>()),
  );

  getIt.registerSingleton<ChatApiService>(
    ChatApiService(getIt<Dio>()),
  );

  getIt.registerSingleton<CallsApiService>(
    CallsApiService(getIt<Dio>()),
  );

  getIt.registerSingleton<NotificationsApiService>(
    NotificationsApiService(getIt<Dio>()),
  );

  getIt.registerSingleton<ReviewsApiService>(
    ReviewsApiService(getIt<Dio>()),
  );

  // Register Auth service
  getIt.registerSingleton<AuthService>(
    AuthService(getIt<UserApiService>()),
  );

  // Register Cart service
  getIt.registerSingleton<CartService>(
    CartService(getIt<LocalStorageService>(), getIt<CartApiService>()),
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

  // Register WebRTC service
  getIt.registerSingleton<WebRTCService>(
    WebRTCService.instance,
  );

  // Register Network Diagnostics service
  getIt.registerSingleton<NetworkDiagnosticsService>(
    NetworkDiagnosticsService.instance,
  );

  // Register Call service
  getIt.registerSingleton<CallService>(
    CallService.instance,
  );

  // Register Wallet service
  getIt.registerSingleton<WalletService>(
    WalletService.instance,
  );

  // Register Notification service
  getIt.registerSingleton<NotificationService>(
    NotificationService(),
  );

  // Note: CallQualitySettings will be registered later in main.dart after LocalStorage is initialized
}