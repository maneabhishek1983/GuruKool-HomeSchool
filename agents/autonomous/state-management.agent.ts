/**
 * State Management Agent
 *
 * Autonomous agent responsible for implementing Riverpod state management
 * across Flutter mobile app. Handles provider setup, state containers,
 * caching strategies, and state synchronization.
 *
 * Priority: 7 (High - Critical for app architecture)
 *
 * Key Responsibilities:
 * - Setup Riverpod providers (StateProvider, StateNotifierProvider, FutureProvider)
 * - Implement state containers for auth, sessions, students, teachers
 * - Configure offline caching with Hive
 * - Implement state persistence and hydration
 * - Handle optimistic UI updates
 * - Sync state with Supabase backend
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface AgentContext {
  action: string;
  payload?: any;
}

interface AgentResult {
  success: boolean;
  message: string;
  artifacts?: string[];
  errors?: string[];
}

export class StateManagementAgent {
  id = 'state-management';
  name = 'State Management Agent';
  priority = 7;

  capabilities = [
    'setup_riverpod_providers',
    'create_state_containers',
    'implement_caching',
    'setup_offline_storage',
    'implement_state_sync',
  ];

  /**
   * Main execution entry point
   */
  async execute(context: AgentContext): Promise<AgentResult> {
    const { action, payload } = context;

    try {
      switch (action) {
        case 'setup_riverpod_providers':
          return await this.setupRiverpodProviders(payload);

        case 'create_state_containers':
          return await this.createStateContainers(payload);

        case 'implement_caching':
          return await this.implementCaching(payload);

        case 'setup_offline_storage':
          return await this.setupOfflineStorage(payload);

        case 'implement_state_sync':
          return await this.implementStateSync(payload);

        default:
          return {
            success: false,
            message: `Unknown action: ${action}`,
            errors: [`Action '${action}' not recognized`],
          };
      }
    } catch (error) {
      return {
        success: false,
        message: `Agent execution failed: ${error instanceof Error ? error.message : String(error)}`,
        errors: [String(error)],
      };
    }
  }

  /**
   * Setup Riverpod providers for global state
   */
  private async setupRiverpodProviders(payload: {
    outputPath: string;
  }): Promise<AgentResult> {
    const { outputPath } = payload;
    const artifacts: string[] = [];

    // Generate auth provider
    const authProviderPath = join(
      outputPath,
      'lib',
      'providers',
      'auth_provider.dart'
    );
    const authProviderCode = this.generateAuthProvider();
    this.writeFile(authProviderPath, authProviderCode);
    artifacts.push(authProviderPath);

    // Generate session provider
    const sessionProviderPath = join(
      outputPath,
      'lib',
      'providers',
      'session_provider.dart'
    );
    const sessionProviderCode = this.generateSessionProvider();
    this.writeFile(sessionProviderPath, sessionProviderCode);
    artifacts.push(sessionProviderPath);

    // Generate student provider
    const studentProviderPath = join(
      outputPath,
      'lib',
      'providers',
      'student_provider.dart'
    );
    const studentProviderCode = this.generateStudentProvider();
    this.writeFile(studentProviderPath, studentProviderCode);
    artifacts.push(studentProviderPath);

    return {
      success: true,
      message: 'Riverpod providers setup complete',
      artifacts,
    };
  }

  /**
   * Create state containers (StateNotifier classes)
   */
  private async createStateContainers(payload: {
    outputPath: string;
  }): Promise<AgentResult> {
    const { outputPath } = payload;
    const artifacts: string[] = [];

    // Generate session state container
    const sessionStatePath = join(
      outputPath,
      'lib',
      'providers',
      'state',
      'session_state.dart'
    );
    const sessionStateCode = this.generateSessionState();
    this.writeFile(sessionStatePath, sessionStateCode);
    artifacts.push(sessionStatePath);

    // Generate auth state container
    const authStatePath = join(
      outputPath,
      'lib',
      'providers',
      'state',
      'auth_state.dart'
    );
    const authStateCode = this.generateAuthState();
    this.writeFile(authStatePath, authStateCode);
    artifacts.push(authStatePath);

    return {
      success: true,
      message: 'State containers created',
      artifacts,
    };
  }

  /**
   * Implement caching strategy with in-memory cache
   */
  private async implementCaching(payload: {
    outputPath: string;
  }): Promise<AgentResult> {
    const { outputPath } = payload;
    const artifacts: string[] = [];

    // Generate cache service
    const cacheServicePath = join(
      outputPath,
      'lib',
      'services',
      'cache.service.dart'
    );
    const cacheServiceCode = this.generateCacheService();
    this.writeFile(cacheServicePath, cacheServiceCode);
    artifacts.push(cacheServicePath);

    return {
      success: true,
      message: 'Caching strategy implemented',
      artifacts,
    };
  }

  /**
   * Setup offline storage with Hive
   */
  private async setupOfflineStorage(payload: {
    outputPath: string;
  }): Promise<AgentResult> {
    const { outputPath } = payload;
    const artifacts: string[] = [];

    // Generate Hive setup
    const hiveSetupPath = join(
      outputPath,
      'lib',
      'services',
      'hive_storage.service.dart'
    );
    const hiveSetupCode = this.generateHiveStorageService();
    this.writeFile(hiveSetupPath, hiveSetupCode);
    artifacts.push(hiveSetupPath);

    // Generate offline sync queue
    const syncQueuePath = join(
      outputPath,
      'lib',
      'services',
      'sync_queue.service.dart'
    );
    const syncQueueCode = this.generateSyncQueueService();
    this.writeFile(syncQueuePath, syncQueueCode);
    artifacts.push(syncQueuePath);

    return {
      success: true,
      message: 'Offline storage setup complete',
      artifacts,
    };
  }

  /**
   * Implement state synchronization with backend
   */
  private async implementStateSync(payload: {
    outputPath: string;
  }): Promise<AgentResult> {
    const { outputPath } = payload;
    const artifacts: string[] = [];

    // Generate sync service
    const syncServicePath = join(
      outputPath,
      'lib',
      'services',
      'state_sync.service.dart'
    );
    const syncServiceCode = this.generateStateSyncService();
    this.writeFile(syncServicePath, syncServiceCode);
    artifacts.push(syncServicePath);

    return {
      success: true,
      message: 'State synchronization implemented',
      artifacts,
    };
  }

  // ==================== CODE GENERATORS ====================

  private generateAuthProvider(): string {
    return `import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'state/auth_state.dart';

/// Auth provider using StateNotifier
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

/// Current user provider
final currentUserProvider = Provider<User?>((ref) {
  final authState = ref.watch(authProvider);
  return authState.user;
});

/// Auth status provider
final isAuthenticatedProvider = Provider<bool>((ref) {
  final authState = ref.watch(authProvider);
  return authState.isAuthenticated;
});
`;
  }

  private generateSessionProvider(): string {
    return `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/teacher_session.dart';
import '../services/supabase.service.dart';
import 'state/session_state.dart';

/// Session state provider
final sessionProvider = StateNotifierProvider<SessionNotifier, SessionState>((ref) {
  return SessionNotifier();
});

/// Active session provider
final activeSessionProvider = Provider<TeacherSession?>((ref) {
  final sessionState = ref.watch(sessionProvider);
  return sessionState.activeSession;
});

/// Session history provider (FutureProvider for async data)
final sessionHistoryProvider = FutureProvider.family<List<TeacherSession>, String>(
  (ref, teacherId) async {
    return await SupabaseService.getTeacherSessions(teacherId);
  },
);

/// Today's sessions provider
final todaySessionsProvider = Provider<List<TeacherSession>>((ref) {
  final sessionState = ref.watch(sessionProvider);
  final now = DateTime.now();

  return sessionState.sessions.where((session) {
    final sessionDate = session.checkInTime;
    return sessionDate.year == now.year &&
           sessionDate.month == now.month &&
           sessionDate.day == now.day;
  }).toList();
});
`;
  }

  private generateStudentProvider(): string {
    return `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/student.dart';
import '../services/supabase.service.dart';

/// Students list provider
final studentsProvider = FutureProvider<List<Student>>((ref) async {
  return await SupabaseService.getStudents();
});

/// Student by ID provider
final studentByIdProvider = FutureProvider.family<Student?, String>(
  (ref, studentId) async {
    return await SupabaseService.getStudentById(studentId);
  },
);

/// Assigned students provider (for teacher)
final assignedStudentsProvider = FutureProvider.family<List<Student>, String>(
  (ref, teacherId) async {
    return await SupabaseService.getAssignedStudents(teacherId);
  },
);
`;
  }

  private generateSessionState(): string {
    return `import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/teacher_session.dart';

/// Session state model
class SessionState {
  final List<TeacherSession> sessions;
  final TeacherSession? activeSession;
  final bool isLoading;
  final String? error;

  SessionState({
    this.sessions = const [],
    this.activeSession,
    this.isLoading = false,
    this.error,
  });

  SessionState copyWith({
    List<TeacherSession>? sessions,
    TeacherSession? activeSession,
    bool? isLoading,
    String? error,
  }) {
    return SessionState(
      sessions: sessions ?? this.sessions,
      activeSession: activeSession ?? this.activeSession,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

/// Session state notifier
class SessionNotifier extends StateNotifier<SessionState> {
  SessionNotifier() : super(SessionState());

  /// Load sessions from backend
  Future<void> loadSessions(String teacherId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // TODO: Load sessions from Supabase
      final sessions = <TeacherSession>[];

      state = state.copyWith(
        sessions: sessions,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Check-in (start session)
  Future<void> checkIn(String teacherId, String studentId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // TODO: Create session in Supabase
      final newSession = TeacherSession(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        teacherId: teacherId,
        studentId: studentId,
        checkInTime: DateTime.now(),
      );

      state = state.copyWith(
        sessions: [...state.sessions, newSession],
        activeSession: newSession,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Check-out (end session)
  Future<void> checkOut(String sessionId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      // TODO: Update session in Supabase
      final updatedSessions = state.sessions.map((session) {
        if (session.id == sessionId) {
          return session.copyWith(checkOutTime: DateTime.now());
        }
        return session;
      }).toList();

      state = state.copyWith(
        sessions: updatedSessions,
        activeSession: null,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Clear all sessions (for logout)
  void clearSessions() {
    state = SessionState();
  }
}
`;
  }

  private generateAuthState(): string {
    return `import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Auth state model
class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;

  AuthState({
    this.user,
    this.isLoading = false,
    this.error,
  });

  bool get isAuthenticated => user != null;

  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

/// Auth state notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final SupabaseClient _supabase = Supabase.instance.client;

  AuthNotifier() : super(AuthState()) {
    _initialize();
  }

  /// Initialize auth state from Supabase
  Future<void> _initialize() async {
    final session = _supabase.auth.currentSession;
    if (session != null) {
      state = state.copyWith(user: session.user);
    }

    // Listen to auth state changes
    _supabase.auth.onAuthStateChange.listen((data) {
      state = state.copyWith(user: data.session?.user);
    });
  }

  /// Login with email and password
  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );

      state = state.copyWith(
        user: response.user,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Logout
  Future<void> logout() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await _supabase.auth.signOut();
      state = AuthState();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }
}
`;
  }

  private generateCacheService(): string {
    return `/// Simple in-memory cache service
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
`;
  }

  private generateHiveStorageService(): string {
    return `import 'package:hive_flutter/hive_flutter.dart';

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
`;
  }

  private generateSyncQueueService(): string {
    return `import 'package:hive_flutter/hive_flutter.dart';

/// Sync queue for offline operations
class SyncQueueService {
  static late Box _queueBox;

  /// Initialize sync queue
  static Future<void> initialize() async {
    _queueBox = await Hive.openBox('sync_queue');
  }

  /// Add operation to queue
  static Future<void> enqueue(SyncOperation operation) async {
    final operations = await getQueue();
    operations.add(operation);
    await _queueBox.put('queue', operations.map((op) => op.toJson()).toList());
  }

  /// Get all queued operations
  static Future<List<SyncOperation>> getQueue() async {
    final data = _queueBox.get('queue', defaultValue: []) as List;
    return data.map((item) => SyncOperation.fromJson(item as Map<String, dynamic>)).toList();
  }

  /// Remove operation from queue
  static Future<void> dequeue(String operationId) async {
    final operations = await getQueue();
    operations.removeWhere((op) => op.id == operationId);
    await _queueBox.put('queue', operations.map((op) => op.toJson()).toList());
  }

  /// Clear queue
  static Future<void> clearQueue() async {
    await _queueBox.clear();
  }
}

class SyncOperation {
  final String id;
  final String type; // 'check_in', 'check_out', etc.
  final Map<String, dynamic> data;
  final DateTime timestamp;

  SyncOperation({
    required this.id,
    required this.type,
    required this.data,
    required this.timestamp,
  });

  factory SyncOperation.fromJson(Map<String, dynamic> json) {
    return SyncOperation(
      id: json['id'] as String,
      type: json['type'] as String,
      data: json['data'] as Map<String, dynamic>,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'data': data,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}
`;
  }

  private generateStateSyncService(): string {
    return `import 'package:connectivity_plus/connectivity_plus.dart';
import 'sync_queue.service.dart';
import 'supabase.service.dart';

/// State synchronization service
class StateSyncService {
  static bool _isSyncing = false;

  /// Check connectivity and sync if online
  static Future<void> syncIfOnline() async {
    final connectivityResult = await Connectivity().checkConnectivity();

    if (connectivityResult == ConnectivityResult.none) {
      print('[StateSyncService] Offline - sync deferred');
      return;
    }

    await syncQueue();
  }

  /// Process sync queue
  static Future<void> syncQueue() async {
    if (_isSyncing) return;

    _isSyncing = true;

    try {
      final operations = await SyncQueueService.getQueue();

      for (final operation in operations) {
        try {
          await _processOperation(operation);
          await SyncQueueService.dequeue(operation.id);
        } catch (e) {
          print('[StateSyncService] Failed to sync operation \${operation.id}: \$e');
        }
      }
    } finally {
      _isSyncing = false;
    }
  }

  /// Process individual operation
  static Future<void> _processOperation(SyncOperation operation) async {
    switch (operation.type) {
      case 'check_in':
        await SupabaseService.createSession(operation.data);
        break;

      case 'check_out':
        await SupabaseService.updateSession(
          operation.data['sessionId'] as String,
          operation.data,
        );
        break;

      default:
        print('[StateSyncService] Unknown operation type: \${operation.type}');
    }
  }

  /// Listen to connectivity changes and auto-sync
  static void startAutoSync() {
    Connectivity().onConnectivityChanged.listen((result) {
      if (result != ConnectivityResult.none) {
        syncQueue();
      }
    });
  }
}
`;
  }

  // ==================== HELPER METHODS ====================

  private writeFile(path: string, content: string): void {
    const dir = path.substring(0, path.lastIndexOf('/'));
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(path, content, 'utf-8');
  }

  private log(
    message: string,
    level: 'info' | 'success' | 'error' = 'info'
  ): void {
    const prefix = {
      info: '[StateManagementAgent]',
      success: '[StateManagementAgent] ✓',
      error: '[StateManagementAgent] ✗',
    }[level];

    console.log(`${prefix} ${message}`);
  }
}
