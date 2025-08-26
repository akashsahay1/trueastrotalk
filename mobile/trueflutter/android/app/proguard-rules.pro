# Flutter Wrapper
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }

# Razorpay
-keep class com.razorpay.** { *; }
-keep class com.razorpay.razorpay_flutter.** { *; }
-keep public class * implements com.razorpay.CheckoutActivity.CheckoutListener { *; }

# Google Pay (GPay) classes for Razorpay
-dontwarn com.google.android.apps.nbu.paisa.inapp.client.api.**
-keep class com.google.android.apps.nbu.paisa.inapp.client.api.** { *; }

# Google Play Core (for deferred components)
-dontwarn com.google.android.play.core.**
-keep class com.google.android.play.core.** { *; }

# ProGuard annotations (missing classes that are causing the error)
-dontwarn proguard.annotation.Keep
-dontwarn proguard.annotation.KeepClassMembers
-dontwarn proguard.annotation.KeepClassMemberNames
-dontwarn proguard.annotation.KeepImplementations
-dontwarn proguard.annotation.KeepInterfaceElements
-dontwarn proguard.annotation.KeepName
-dontwarn proguard.annotation.KeepParameterNames
-dontwarn proguard.annotation.KeepPublic

# Firebase
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**

# WebRTC
-keep class org.webrtc.** { *; }
-dontwarn org.webrtc.**

# General Android
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep custom views
-keep public class * extends android.view.View {
    public <init>(android.content.Context);
    public <init>(android.content.Context, android.util.AttributeSet);
    public <init>(android.content.Context, android.util.AttributeSet, int);
    public void set*(...);
}

# Keep Parcelables
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# JSON serialization
-keep class com.google.gson.** { *; }
-keep class org.json.** { *; }

# Common issues
-dontwarn okio.**
-dontwarn okhttp3.**
-dontwarn retrofit2.**
-dontwarn rx.**