import 'package:hive_flutter/hive_flutter.dart';

/// Hive offline storage service
class HiveStorageService {
  static late Box _sessionBox;
  static late Box _settingsBox;

  /// Initialize Hive
  static Future<void> initialize() async {
    await Hive.initFlutter();

    // Open boxes
    _sessionBox = await Hive.openBox('sessions');
    _settingsBox = await Hive.openBox('settings');
  }

  /// Save session offline
  static Future<void> saveSession(String sessionId, Map<String, dynamic> data) async {
    await _sessionBox.put(sessionId, data);
  }

  /// Get session from offline storage
  static Map<String, dynamic>? getSession(String sessionId) {
    return _sessionBox.get(sessionId) as Map<String, dynamic>?;
  }

  /// Get all sessions from offline storage
  static List<Map<String, dynamic>> getAllSessions() {
    return _sessionBox.values.cast<Map<String, dynamic>>().toList();
  }

  /// Clear offline sessions
  static Future<void> clearSessions() async {
    await _sessionBox.clear();
  }

  /// Save setting
  static Future<void> saveSetting(String key, dynamic value) async {
    await _settingsBox.put(key, value);
  }

  /// Get setting
  static T? getSetting<T>(String key) {
    return _settingsBox.get(key) as T?;
  }
}
