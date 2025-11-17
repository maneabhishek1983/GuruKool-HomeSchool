/// Simple in-memory cache service
class CacheService {
  static final Map<String, CacheEntry> _cache = {};

  /// Get cached value
  static T? get<T>(String key) {
    final entry = _cache[key];
    if (entry == null) return null;

    // Check if expired
    if (entry.expiresAt.isBefore(DateTime.now())) {
      _cache.remove(key);
      return null;
    }

    return entry.value as T?;
  }

  /// Set cached value with TTL (time-to-live)
  static void set<T>(String key, T value, {Duration ttl = const Duration(minutes: 5)}) {
    _cache[key] = CacheEntry(
      value: value,
      expiresAt: DateTime.now().add(ttl),
    );
  }

  /// Clear cache
  static void clear() {
    _cache.clear();
  }

  /// Remove specific key
  static void remove(String key) {
    _cache.remove(key);
  }
}

class CacheEntry {
  final dynamic value;
  final DateTime expiresAt;

  CacheEntry({
    required this.value,
    required this.expiresAt,
  });
}
