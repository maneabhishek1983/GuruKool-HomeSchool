import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:gurukool_teacher/providers/auth_provider.dart';
import 'package:gurukool_teacher/screens/splash_screen.dart';
import 'package:gurukool_teacher/screens/login_screen.dart';
import 'package:gurukool_teacher/screens/forgot_password_screen.dart';
import 'package:gurukool_teacher/screens/home_screen.dart';
import 'package:gurukool_teacher/screens/qr_scanner_screen.dart';
import 'package:gurukool_teacher/screens/session_history_screen.dart';

/// Router configuration with auth redirects
final routerProvider = Provider<GoRouter>((ref) {
  final isAuthenticated = ValueNotifier<bool>(false);

  // Watch auth state and update router
  ref.listen<bool>(
    isAuthenticatedProvider,
    (previous, next) {
      isAuthenticated.value = next;
    },
    fireImmediately: true,
  );

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: isAuthenticated,
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final authenticated = isAuthenticated.value;
      final isSplash = state.matchedLocation == '/splash';
      final isLogin = state.matchedLocation == '/login';
      final isForgotPassword = state.matchedLocation == '/forgot-password';

      // If on splash screen, redirect based on auth state
      if (isSplash) {
        // Redirect to home if authenticated, otherwise to login
        return authenticated ? '/home' : '/login';
      }

      // If not authenticated and not on login/forgot-password, redirect to login
      if (!authenticated && !isLogin && !isForgotPassword) {
        return '/login';
      }

      // If authenticated and on login/forgot-password, redirect to home
      if (authenticated && (isLogin || isForgotPassword)) {
        return '/home';
      }

      // No redirect needed
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        name: 'forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/qr-scanner',
        name: 'qr-scanner',
        builder: (context, state) => const QRScannerScreen(),
      ),
      GoRoute(
        path: '/sessions',
        name: 'sessions',
        builder: (context, state) => const SessionHistoryScreen(),
      ),
      // Redirect root to splash
      GoRoute(
        path: '/',
        redirect: (context, state) => '/splash',
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 80,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Page not found',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              state.uri.toString(),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey,
                  ),
            ),
            const SizedBox(height: 24),
            TextButton(
              onPressed: () => context.go('/splash'),
              child: const Text('Go to Home'),
            ),
          ],
        ),
      ),
    ),
  );
});
