import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:gurukool_teacher/services/hive_storage.service.dart';
import 'package:gurukool_teacher/services/sync_queue.service.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Offline Storage E2E Tests', () {
    setUpAll(() async {
      // Initialize Hive storage for tests
      await HiveStorageService.initialize();
      await SyncQueueService.initialize();
    });

    test('Hive can save and retrieve session data', () async {
      final sessionId = 'test_session_${DateTime.now().millisecondsSinceEpoch}';
      final sessionData = {
        'studentId': 'student_123',
        'teacherId': 'teacher_456',
        'sessionStart': DateTime.now().toIso8601String(),
        'location': 'Test Location',
      };

      // Save session
      await HiveStorageService.saveSession(sessionId, sessionData);

      // Retrieve session
      final retrieved = HiveStorageService.getSession(sessionId);

      // Verify data matches
      expect(retrieved, isNotNull);
      expect(retrieved!['studentId'], equals('student_123'));
      expect(retrieved['teacherId'], equals('teacher_456'));
      expect(retrieved['location'], equals('Test Location'));
    });

    test('Hive can save and retrieve settings', () async {
      final settingKey = 'test_setting_${DateTime.now().millisecondsSinceEpoch}';
      final settingValue = 'test_value_123';

      // Save setting
      await HiveStorageService.saveSetting(settingKey, settingValue);

      // Retrieve setting
      final retrieved = HiveStorageService.getSetting(settingKey);

      // Verify value matches
      expect(retrieved, equals(settingValue));
    });

    test('SyncQueue can enqueue and dequeue operations', () async {
      final operationId = 'op_${DateTime.now().millisecondsSinceEpoch}';
      final operation = SyncOperation(
        id: operationId,
        type: 'check_in',
        data: {
          'studentId': 'student_789',
          'timestamp': DateTime.now().toIso8601String(),
        },
        timestamp: DateTime.now(),
      );

      // Enqueue operation
      await SyncQueueService.enqueue(operation);

      // Get queue
      final queue = await SyncQueueService.getQueue();

      // Verify operation is in queue
      expect(queue.any((op) => op.id == operationId), isTrue);

      // Dequeue operation
      await SyncQueueService.dequeue(operationId);

      // Verify operation is removed
      final updatedQueue = await SyncQueueService.getQueue();
      expect(updatedQueue.any((op) => op.id == operationId), isFalse);
    });

    test('Multiple sessions can be stored and retrieved', () async {
      final session1Id = 'session_1_${DateTime.now().millisecondsSinceEpoch}';
      final session2Id = 'session_2_${DateTime.now().millisecondsSinceEpoch}';

      await HiveStorageService.saveSession(session1Id, {'data': 'session1'});
      await HiveStorageService.saveSession(session2Id, {'data': 'session2'});

      final allSessions = HiveStorageService.getAllSessions();

      // Verify both sessions are present
      expect(allSessions.containsKey(session1Id), isTrue);
      expect(allSessions.containsKey(session2Id), isTrue);
      expect(allSessions[session1Id]!['data'], equals('session1'));
      expect(allSessions[session2Id]!['data'], equals('session2'));
    });

    test('SyncQueue persists across operations', () async {
      // Clear queue first
      await SyncQueueService.clearQueue();

      // Add multiple operations
      for (int i = 0; i < 3; i++) {
        final op = SyncOperation(
          id: 'op_$i',
          type: 'test',
          data: {'index': i},
          timestamp: DateTime.now(),
        );
        await SyncQueueService.enqueue(op);
      }

      // Verify all operations are queued
      final queue = await SyncQueueService.getQueue();
      expect(queue.length, equals(3));
      expect(queue[0].id, equals('op_0'));
      expect(queue[1].id, equals('op_1'));
      expect(queue[2].id, equals('op_2'));
    });
  });
}
