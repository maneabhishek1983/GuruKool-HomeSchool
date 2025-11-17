import 'package:hive_flutter/hive_flutter.dart';

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
