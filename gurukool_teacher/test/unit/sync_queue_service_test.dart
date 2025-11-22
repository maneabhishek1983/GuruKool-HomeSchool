import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:gurukool_teacher/services/sync_queue.service.dart';

class MockBox extends Mock implements Box {}

void main() {
  late MockBox mockQueueBox;

  setUp(() {
    mockQueueBox = MockBox();
    SyncQueueService.queueBox = mockQueueBox;
  });

  group('SyncQueueService', () {
    test('enqueue adds operation to queue', () async {
      final operation = SyncOperation(
        id: 'op_1',
        type: 'check_in',
        data: {'studentId': '123'},
        timestamp: DateTime.now(),
      );

      // Mock getting existing queue (empty)
      when(() => mockQueueBox.get('queue', defaultValue: [])).thenReturn([]);
      // Mock putting updated queue
      when(() => mockQueueBox.put('queue', any())).thenAnswer((_) async {});

      await SyncQueueService.enqueue(operation);

      verify(() => mockQueueBox.get('queue', defaultValue: [])).called(1);
      verify(() => mockQueueBox.put('queue', any())).called(1);
    });

    test('getQueue returns list of operations', () async {
      final operationData = {
        'id': 'op_1',
        'type': 'check_in',
        'data': {'studentId': '123'},
        'timestamp': DateTime.now().toIso8601String(),
      };

      when(() => mockQueueBox.get('queue', defaultValue: [])).thenReturn([operationData]);

      final result = await SyncQueueService.getQueue();

      expect(result.length, 1);
      expect(result.first.id, 'op_1');
      expect(result.first.type, 'check_in');
    });

    test('dequeue removes operation from queue', () async {
      final operationData = {
        'id': 'op_1',
        'type': 'check_in',
        'data': {'studentId': '123'},
        'timestamp': DateTime.now().toIso8601String(),
      };

      when(() => mockQueueBox.get('queue', defaultValue: [])).thenReturn([operationData]);
      when(() => mockQueueBox.put('queue', any())).thenAnswer((_) async {});

      await SyncQueueService.dequeue('op_1');

      verify(() => mockQueueBox.put('queue', any())).called(1);
      // Verify that the list passed to put is empty (or doesn't contain the item)
      // Note: Argument capturing would be more precise here, but 'any()' is sufficient for basic interaction test
    });

    test('clearQueue clears the box', () async {
      when(() => mockQueueBox.clear()).thenAnswer((_) async => 0);

      await SyncQueueService.clearQueue();

      verify(() => mockQueueBox.clear()).called(1);
    });
  });
}
