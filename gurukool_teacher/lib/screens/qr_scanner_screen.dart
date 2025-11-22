import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart'; // For kIsWeb
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:gurukool_teacher/design_system/tokens/colors.dart';
import 'package:gurukool_teacher/design_system/tokens/spacing.dart';
import 'package:gurukool_teacher/design_system/tokens/typography.dart';
import 'package:gurukool_teacher/providers/auth_provider.dart';

/// QR Scanner Screen - Scan student QR codes for check-in/out
class QRScannerScreen extends ConsumerStatefulWidget {
  const QRScannerScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends ConsumerState<QRScannerScreen> {
  MobileScannerController? _controller;
  final TextEditingController _manualQRController = TextEditingController();
  bool _isProcessing = false;
  String? _scannedData;

  @override
  void initState() {
    super.initState();
    // Only initialize camera controller on mobile
    if (!kIsWeb) {
      _controller = MobileScannerController(
        detectionSpeed: DetectionSpeed.normal,
        facing: CameraFacing.back,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Scan QR Code'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: Icon(
              _controller?.torchEnabled ?? false
                  ? Icons.flash_on
                  : Icons.flash_off,
            ),
            onPressed: () => _controller?.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.cameraswitch),
            onPressed: () => _controller?.switchCamera(),
          ),
        ],
      ),
      body: kIsWeb ? _buildWebFallbackUI() : Stack(
        children: [
          // Camera view (mobile only)
          MobileScanner(
            controller: _controller,
            onDetect: _handleQRCodeDetected,
          ),

          // Scan area overlay
          _buildScanOverlay(),

          // Instructions
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(Spacing.xl),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.bottomCenter,
                  end: Alignment.topCenter,
                  colors: [
                    Colors.black.withOpacity(0.8),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (_isProcessing)
                    Column(
                      children: [
                        const CircularProgressIndicator(
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                        const SizedBox(height: Spacing.md),
                        Text(
                          'Processing...',
                          style: AppTypography.textTheme.titleMedium?.copyWith(
                            color: Colors.white,
                          ),
                        ),
                      ],
                    )
                  else
                    Column(
                      children: [
                        Icon(
                          Icons.qr_code_scanner,
                          size: 48,
                          color: Colors.white.withOpacity(0.8),
                        ),
                        const SizedBox(height: Spacing.md),
                        Text(
                          'Position QR code within frame',
                          style: AppTypography.textTheme.titleMedium?.copyWith(
                            color: Colors.white,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: Spacing.sm),
                        Text(
                          'Scanner will automatically detect the code',
                          style: AppTypography.textTheme.bodySmall?.copyWith(
                            color: Colors.white.withOpacity(0.7),
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ),

          // Scanned data preview (for debugging)
          if (_scannedData != null)
            Positioned(
              top: 16,
              left: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.all(Spacing.md),
                decoration: BoxDecoration(
                  color: AppColors.success,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'Scanned: $_scannedData',
                  style: AppTypography.textTheme.bodySmall?.copyWith(
                    color: Colors.white,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildScanOverlay() {
    return CustomPaint(
      painter: ScanOverlayPainter(),
      child: Container(),
    );
  }

  /// Web fallback UI - Manual QR code input
  Widget _buildWebFallbackUI() {
    return Container(
      padding: const EdgeInsets.all(Spacing.xl),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Info card
          Container(
            padding: const EdgeInsets.all(Spacing.lg),
            decoration: BoxDecoration(
              color: AppColors.info50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.info),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: AppColors.info, size: 24),
                const SizedBox(width: Spacing.md),
                Expanded(
                  child: Text(
                    'Camera not available in web browser. Please paste QR code JSON data below.',
                    style: AppTypography.textTheme.bodySmall?.copyWith(
                      color: AppColors.info600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: Spacing.xxl),

          // QR code icon
          Icon(
            Icons.qr_code_2,
            size: 100,
            color: AppColors.primary,
          ),
          const SizedBox(height: Spacing.xl),

          // Title
          Text(
            'Manual QR Code Input',
            style: AppTypography.textTheme.headlineMedium?.copyWith(
              color: AppColors.gray900,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Spacing.md),

          // Instructions
          Text(
            'Paste the QR code JSON data generated from the web app.',
            style: AppTypography.textTheme.bodyMedium?.copyWith(
              color: AppColors.gray600,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: Spacing.xxl),

          // Text field
          TextField(
            controller: _manualQRController,
            maxLines: 6,
            decoration: InputDecoration(
              labelText: 'QR Code JSON Data',
              hintText: '{\n  "type": "teacher_auth",\n  "teacherId": "...",\n  ...\n}',
              helperText: 'Expected format: JSON with type, teacherId, studentId, parentId',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          const SizedBox(height: Spacing.xl),

          // Submit button
          ElevatedButton(
            onPressed: _isProcessing ? null : () {
              final qrData = _manualQRController.text.trim();
              if (qrData.isNotEmpty) {
                _handleManualQRInput(qrData);
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Please paste QR code data'),
                    backgroundColor: AppColors.warning,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: Spacing.md),
            ),
            child: _isProcessing
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      ),
                      const SizedBox(width: Spacing.md),
                      Text('Processing...'),
                    ],
                  )
                : Text('Process QR Code'),
          ),
          const SizedBox(height: Spacing.md),

          // Example button
          TextButton(
            onPressed: () {
              // Fill with example QR code
              _manualQRController.text = '''
{
  "type": "teacher_auth",
  "teacherId": "example-teacher-uuid",
  "studentId": "example-student-uuid",
  "parentId": "example-parent-uuid",
  "timestamp": ${DateTime.now().millisecondsSinceEpoch},
  "signature": "example-signature"
}''';
            },
            child: Text('Fill with Example Data'),
          ),
        ],
      ),
    );
  }

  /// Handle manual QR input (web fallback)
  void _handleManualQRInput(String qrData) {
    // Same processing as camera scan
    if (_isProcessing) return;

    setState(() {
      _isProcessing = true;
      _scannedData = qrData;
    });

    // Process QR code data (reuse existing logic)
    _processQRCode(qrData);
  }

  void _handleQRCodeDetected(BarcodeCapture capture) async {
    if (_isProcessing) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? code = barcodes.first.rawValue;
    if (code == null || code.isEmpty) return;

    setState(() {
      _isProcessing = true;
      _scannedData = code;
    });

    _processQRCode(code);
  }

  /// Shared QR code processing logic (used by both camera scan and manual input)
  void _processQRCode(String code) async {
    try {
      // Get current location
      final position = await _getCurrentLocation();

      // Parse QR code data (expected format: JSON with student_id, parent_id, etc.)
      final qrData = _parseQRCode(code);

      if (qrData == null) {
        throw Exception('Invalid QR code format');
      }

      // Create session via Supabase
      final user = ref.read(currentUserProvider);
      if (user == null) {
        throw Exception('Not authenticated');
      }

      final session = await Supabase.instance.client
          .from('teacher_sessions')
          .insert({
            'teacher_id': user.id,
            'student_id': qrData['student_id'],
            'parent_id': qrData['parent_id'],
            'session_start': DateTime.now().toIso8601String(),
            'location': '${position.latitude},${position.longitude}',
            'qr_code_used': code,
          })
          .select()
          .single();

      if (!mounted) return;

      // Success - navigate to check-in confirmation
      context.go('/check-in-success', extra: session);
    } catch (e) {
      if (!mounted) return;

      setState(() => _isProcessing = false);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Map<String, dynamic>? _parseQRCode(String code) {
    try {
      // Parse JSON from QR code
      // Expected format from web app (teacher-qr.service.ts):
      // {
      //   "type": "teacher_auth",
      //   "teacherId": "...",
      //   "studentId": "...",
      //   "parentId": "...",
      //   "timestamp": 1234567890,
      //   "signature": "..."
      // }
      final Map<String, dynamic> qrData =
          Map<String, dynamic>.from(jsonDecode(code) as Map);

      // Validate QR code type
      if (qrData['type'] != 'teacher_auth') {
        throw Exception('Invalid QR code type: ${qrData['type']}');
      }

      // Validate required fields
      final requiredFields = ['teacherId', 'studentId', 'parentId', 'signature'];
      for (final field in requiredFields) {
        if (!qrData.containsKey(field) || qrData[field] == null) {
          throw Exception('Missing required field: $field');
        }
      }

      // Check if QR code is expired (24 hours expiration)
      if (qrData.containsKey('timestamp')) {
        final timestamp = qrData['timestamp'] as int;
        final qrDate = DateTime.fromMillisecondsSinceEpoch(timestamp);
        final hoursSinceCreation = DateTime.now().difference(qrDate).inHours;

        if (hoursSinceCreation > 24) {
          throw Exception('QR code expired (${hoursSinceCreation} hours old)');
        }
      }

      return {
        'student_id': qrData['studentId'],
        'parent_id': qrData['parentId'],
        'teacher_id': qrData['teacherId'],
        'signature': qrData['signature'],
        'qr_code_id': code,
      };
    } catch (e) {
      print('Error parsing QR code: $e');
      return null;
    }
  }

  Future<Position> _getCurrentLocation() async {
    // Check permission
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        throw Exception('Location permission denied');
      }
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permission permanently denied');
    }

    // Get current position
    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  }

  @override
  void dispose() {
    _controller?.dispose();
    _manualQRController.dispose();
    super.dispose();
  }
}

/// Custom painter for scan overlay
class ScanOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black.withOpacity(0.5)
      ..style = PaintingStyle.fill;

    final scanAreaSize = size.width * 0.7;
    final scanAreaRect = Rect.fromCenter(
      center: Offset(size.width / 2, size.height / 2),
      width: scanAreaSize,
      height: scanAreaSize,
    );

    // Draw dark overlay with transparent scan area
    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(
        scanAreaRect,
        const Radius.circular(16),
      ))
      ..fillType = PathFillType.evenOdd;

    canvas.drawPath(path, paint);

    // Draw scan area corners
    final cornerPaint = Paint()
      ..color = AppColors.primary
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;

    final cornerLength = 30.0;

    // Top-left corner
    canvas.drawLine(
      scanAreaRect.topLeft,
      scanAreaRect.topLeft.translate(cornerLength, 0),
      cornerPaint,
    );
    canvas.drawLine(
      scanAreaRect.topLeft,
      scanAreaRect.topLeft.translate(0, cornerLength),
      cornerPaint,
    );

    // Top-right corner
    canvas.drawLine(
      scanAreaRect.topRight,
      scanAreaRect.topRight.translate(-cornerLength, 0),
      cornerPaint,
    );
    canvas.drawLine(
      scanAreaRect.topRight,
      scanAreaRect.topRight.translate(0, cornerLength),
      cornerPaint,
    );

    // Bottom-left corner
    canvas.drawLine(
      scanAreaRect.bottomLeft,
      scanAreaRect.bottomLeft.translate(cornerLength, 0),
      cornerPaint,
    );
    canvas.drawLine(
      scanAreaRect.bottomLeft,
      scanAreaRect.bottomLeft.translate(0, -cornerLength),
      cornerPaint,
    );

    // Bottom-right corner
    canvas.drawLine(
      scanAreaRect.bottomRight,
      scanAreaRect.bottomRight.translate(-cornerLength, 0),
      cornerPaint,
    );
    canvas.drawLine(
      scanAreaRect.bottomRight,
      scanAreaRect.bottomRight.translate(0, -cornerLength),
      cornerPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
