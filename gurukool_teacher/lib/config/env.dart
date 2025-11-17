import 'package:flutter_dotenv/flutter_dotenv.dart';

/// Environment configuration loaded from .env file
/// Uses flutter_dotenv to read environment variables at runtime
class Env {
  /// Supabase project URL
  static String get supabaseUrl =>
      dotenv.env['SUPABASE_URL'] ?? 'https://miqhtpbutevdrkyndflf.supabase.co';

  /// Supabase anonymous key (public, RLS-protected)
  static String get supabaseAnonKey => dotenv.env['SUPABASE_ANON_KEY'] ?? '';

  /// API base URL for backend endpoints
  static String get apiBaseUrl =>
      dotenv.env['API_BASE_URL'] ?? 'https://gurukool-homeschool.vercel.app';

  /// QR code signing secret (32-byte base64 string)
  static String get qrSecret => dotenv.env['QR_SECRET'] ?? '';

  /// Current environment (development, staging, production)
  static String get environment => dotenv.env['ENVIRONMENT'] ?? 'development';

  /// Sentry DSN for error tracking (optional)
  static String get sentryDsn => dotenv.env['SENTRY_DSN'] ?? '';

  /// Check if running in development mode
  static bool get isDevelopment => environment == 'development';

  /// Check if running in production mode
  static bool get isProduction => environment == 'production';

  /// Check if running in staging mode
  static bool get isStaging => environment == 'staging';
}
