import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:gurukool_teacher/services/hive_storage.service.dart';

class MockBox extends Mock implements Box {}

void main() {
  late MockBox mockSessionBox;
  late MockBox mockSettingsBox;

  setUp(() {
    mockSessionBox = MockBox();
    mockSettingsBox = MockBox();
    
    // Inject mock boxes
    HiveStorageService.sessionBox = mockSessionBox;
    HiveStorageService.settingsBox = mockSettingsBox;
  });

  group('HiveStorageService', () {
    test('saveSession puts data into session box', () async {
      const sessionId = 'session_123';
      final data = {'id': sessionId, 'status': 'active'};

      when(() => mockSessionBox.put(sessionId, data)).thenAnswer((_) async {});

      await HiveStorageService.saveSession(sessionId, data);

      verify(() => mockSessionBox.put(sessionId, data)).called(1);
    });

    test('getSession retrieves data from session box', () {
      const sessionId = 'session_123';
      final data = {'id': sessionId, 'status': 'active'};

      when(() => mockSessionBox.get(sessionId)).thenReturn(data);

      final result = HiveStorageService.getSession(sessionId);

      expect(result, equals(data));
      verify(() => mockSessionBox.get(sessionId)).called(1);
    });

    test('getAllSessions returns all values from session box', () {
      final sessions = [
        {'id': '1', 'status': 'active'},
        {'id': '2', 'status': 'completed'},
      ];

      when(() => mockSessionBox.values).thenReturn(sessions);

      final result = HiveStorageService.getAllSessions();

      expect(result, equals(sessions));
    });

    test('saveSetting puts data into settings box', () async {
      const key = 'theme';
      const value = 'dark';

      when(() => mockSettingsBox.put(key, value)).thenAnswer((_) async {});

      await HiveStorageService.saveSetting(key, value);

      verify(() => mockSettingsBox.put(key, value)).called(1);
    });
  });
}
