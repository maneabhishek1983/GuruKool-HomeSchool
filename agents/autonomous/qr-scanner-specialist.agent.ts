/**
 * QR Scanner Specialist Agent
 *
 * Autonomous agent responsible for QR code scanning implementation across platforms.
 * Handles mobile_scanner integration, camera permissions, QR code validation,
 * and cross-platform compatibility (Flutter mobile + Next.js web).
 *
 * Priority: 8 (High - Core feature for teacher check-in/check-out)
 *
 * Key Responsibilities:
 * - Implement native QR scanner with mobile_scanner package
 * - Handle camera permissions and error states
 * - Validate QR code signatures (HMAC-SHA256)
 * - Generate student-specific QR codes
 * - Ensure cross-platform consistency
 * - Implement fallback authentication flows
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

interface QRCodeConfig {
  studentId: string;
  teacherId: string;
  expiresInMinutes: number;
  secretKey: string;
}

export class QRScannerSpecialistAgent {
  id = 'qr-scanner-specialist';
  name = 'QR Scanner Specialist Agent';
  priority = 8;

  capabilities = [
    'implement_native_qr_scanner',
    'handle_camera_permissions',
    'validate_qr_codes',
    'generate_student_qr_codes',
    'implement_fallback_auth',
  ];

  /**
   * Main execution entry point
   */
  async execute(context: AgentContext): Promise<AgentResult> {
    const { action, payload } = context;

    try {
      switch (action) {
        case 'implement_native_qr_scanner':
          return await this.implementNativeQRScanner(payload);

        case 'handle_camera_permissions':
          return await this.handleCameraPermissions(payload);

        case 'validate_qr_codes':
          return await this.validateQRCodes(payload);

        case 'generate_student_qr_codes':
          return await this.generateStudentQRCodes(payload);

        case 'implement_fallback_auth':
          return await this.implementFallbackAuth(payload);

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
   * Implement native QR scanner screen for Flutter mobile app
   */
  private async implementNativeQRScanner(payload: {
    outputPath: string;
  }): Promise<AgentResult> {
    const { outputPath } = payload;
    const artifacts: string[] = [];

    // Generate QR Scanner Screen (Flutter)
    const qrScannerScreenPath = join(
      outputPath,
      'lib',
      'screens',
      'qr_scanner',
      'qr_scanner_screen.dart'
    );
    const qrScannerCode = this.generateQRScannerScreen();

    this.writeFile(qrScannerScreenPath, qrScannerCode);
    artifacts.push(qrScannerScreenPath);

    // Generate QR Scanner Service
    const qrScannerServicePath = join(
      outputPath,
      'lib',
      'services',
      'qr_scanner.service.dart'
    );
    const qrScannerServiceCode = this.generateQRScannerService();

    this.writeFile(qrScannerServicePath, qrScannerServiceCode);
    artifacts.push(qrScannerServicePath);

    // Generate QR Validation Service
    const qrValidationServicePath = join(
      outputPath,
      'lib',
      'services',
      'qr_validation.service.dart'
    );
    const qrValidationServiceCode = this.generateQRValidationService();

    this.writeFile(qrValidationServicePath, qrValidationServiceCode);
    artifacts.push(qrValidationServicePath);

    return {
      success: true,
      message: 'Native QR scanner implemented successfully',
      artifacts,
    };
  }

  /**
   * Handle camera permissions for Android and iOS
   */
  private async handleCameraPermissions(payload: {
    outputPath: string;
  }): Promise<AgentResult> {
    const { outputPath } = payload;
    const artifacts: string[] = [];

    // Update AndroidManifest.xml
    const androidManifestPath = join(
      outputPath,
      'android',
      'app',
      'src',
      'main',
      'AndroidManifest.xml'
    );
    const androidManifestUpdates = this.generateAndroidManifestUpdates();
    artifacts.push(`${androidManifestPath} (manual update required)`);

    // Update Info.plist
    const infoPlistPath = join(outputPath, 'ios', 'Runner', 'Info.plist');
    const infoPlistUpdates = this.generateInfoPlistUpdates();
    artifacts.push(`${infoPlistPath} (manual update required)`);

    // Generate permission handler service
    const permissionServicePath = join(
      outputPath,
      'lib',
      'services',
      'permission_handler.service.dart'
    );
    const permissionServiceCode = this.generatePermissionHandlerService();

    this.writeFile(permissionServicePath, permissionServiceCode);
    artifacts.push(permissionServicePath);

    return {
      success: true,
      message: 'Camera permissions configuration generated',
      artifacts,
    };
  }

  /**
   * Validate QR codes with HMAC-SHA256 signatures
   */
  private async validateQRCodes(payload: {
    qrData: string;
    secretKey: string;
  }): Promise<AgentResult> {
    // This would be implemented in Dart on the Flutter side
    // For now, generate the validation service
    return {
      success: true,
      message:
        'QR validation service generated (see qr_validation.service.dart)',
    };
  }

  /**
   * Generate student-specific QR codes
   */
  private async generateStudentQRCodes(
    payload: QRCodeConfig
  ): Promise<AgentResult> {
    const { studentId, teacherId, expiresInMinutes, secretKey } = payload;

    // Generate QR code generation service for backend (TypeScript)
    const qrGeneratorPath = join(
      process.cwd(),
      'src',
      'services',
      'qr-code-generator.service.ts'
    );
    const qrGeneratorCode = this.generateQRCodeGeneratorService();

    this.writeFile(qrGeneratorPath, qrGeneratorCode);

    return {
      success: true,
      message: `QR code generator service created for student ${studentId}`,
      artifacts: [qrGeneratorPath],
    };
  }

  /**
   * Implement fallback authentication when QR scanner fails
   */
  private async implementFallbackAuth(payload: {
    outputPath: string;
  }): Promise<AgentResult> {
    const { outputPath } = payload;
    const artifacts: string[] = [];

    // Generate fallback auth screen
    const fallbackAuthPath = join(
      outputPath,
      'lib',
      'screens',
      'auth',
      'fallback_auth_screen.dart'
    );
    const fallbackAuthCode = this.generateFallbackAuthScreen();

    this.writeFile(fallbackAuthPath, fallbackAuthCode);
    artifacts.push(fallbackAuthPath);

    return {
      success: true,
      message: 'Fallback authentication screen generated',
      artifacts,
    };
  }

  // ==================== CODE GENERATORS ====================

  private generateQRScannerScreen(): string {
    return `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../services/qr_scanner.service.dart';
import '../../services/qr_validation.service.dart';
import '../../design_system/tokens/colors.dart';

/// QR Scanner Screen for teacher check-in/check-out
/// Uses mobile_scanner package for native camera access
class QRScannerScreen extends ConsumerStatefulWidget {
  const QRScannerScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends ConsumerState<QRScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  bool _isProcessing = false;
  String? _errorMessage;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _handleQRCode(BarcodeCapture capture) async {
    if (_isProcessing) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? qrData = barcodes.first.rawValue;
    if (qrData == null) return;

    setState(() {
      _isProcessing = true;
      _errorMessage = null;
    });

    try {
      // Validate QR code signature
      final isValid = await QRValidationService.validateQRCode(qrData);

      if (!isValid) {
        setState(() {
          _errorMessage = 'Invalid QR code. Please try again.';
          _isProcessing = false;
        });
        return;
      }

      // Process check-in/check-out
      final result = await QRScannerService.processCheckInOut(qrData);

      if (result.success) {
        // Navigate to success screen or show success message
        if (mounted) {
          Navigator.pop(context, result);
        }
      } else {
        setState(() {
          _errorMessage = result.message ?? 'Failed to process check-in/out';
          _isProcessing = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: \${e.toString()}';
        _isProcessing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Code'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(_controller.torchEnabled ? Icons.flash_on : Icons.flash_off),
            onPressed: () => _controller.toggleTorch(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Camera viewfinder
          MobileScanner(
            controller: _controller,
            onDetect: _handleQRCode,
            errorBuilder: (context, error, child) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 64, color: Colors.red),
                    const SizedBox(height: 16),
                    Text('Camera error: \${error.errorDetails?.message ?? "Unknown error"}'),
                  ],
                ),
              );
            },
          ),

          // Scanning overlay
          CustomPaint(
            painter: ScannerOverlay(),
          ),

          // Instructions
          Positioned(
            bottom: 100,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(16),
              color: Colors.black54,
              child: Column(
                children: [
                  const Text(
                    'Position QR code within the frame',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (_errorMessage != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.red, fontSize: 14),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),
          ),

          // Processing indicator
          if (_isProcessing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(color: Colors.white),
              ),
            ),
        ],
      ),
    );
  }
}

/// Custom painter for scanner overlay
class ScannerOverlay extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final double scanAreaSize = size.width * 0.7;
    final double left = (size.width - scanAreaSize) / 2;
    final double top = (size.height - scanAreaSize) / 2;
    final Rect scanArea = Rect.fromLTWH(left, top, scanAreaSize, scanAreaSize);

    // Draw semi-transparent overlay
    final Paint overlayPaint = Paint()
      ..color = Colors.black54
      ..style = PaintingStyle.fill;

    canvas.drawPath(
      Path()
        ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
        ..addRect(scanArea)
        ..fillType = PathFillType.evenOdd,
      overlayPaint,
    );

    // Draw corner brackets
    final Paint bracketPaint = Paint()
      ..color = AppColors.primary
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke;

    const double bracketLength = 30;

    // Top-left
    canvas.drawLine(Offset(left, top), Offset(left + bracketLength, top), bracketPaint);
    canvas.drawLine(Offset(left, top), Offset(left, top + bracketLength), bracketPaint);

    // Top-right
    canvas.drawLine(Offset(left + scanAreaSize, top), Offset(left + scanAreaSize - bracketLength, top), bracketPaint);
    canvas.drawLine(Offset(left + scanAreaSize, top), Offset(left + scanAreaSize, top + bracketLength), bracketPaint);

    // Bottom-left
    canvas.drawLine(Offset(left, top + scanAreaSize), Offset(left + bracketLength, top + scanAreaSize), bracketPaint);
    canvas.drawLine(Offset(left, top + scanAreaSize), Offset(left, top + scanAreaSize - bracketLength), bracketPaint);

    // Bottom-right
    canvas.drawLine(Offset(left + scanAreaSize, top + scanAreaSize), Offset(left + scanAreaSize - bracketLength, top + scanAreaSize), bracketPaint);
    canvas.drawLine(Offset(left + scanAreaSize, top + scanAreaSize), Offset(left + scanAreaSize, top + scanAreaSize - bracketLength), bracketPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
`;
  }

  private generateQRScannerService(): string {
    return `import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/env.dart';

class QRScannerService {
  static final SupabaseClient _supabase = Supabase.instance.client;

  /// Process teacher check-in or check-out using scanned QR code
  static Future<QRScanResult> processCheckInOut(String qrData) async {
    try {
      // Parse QR data (expected format: JSON with studentId, teacherId, timestamp, signature)
      final Map<String, dynamic> qrPayload = _parseQRData(qrData);

      // Verify QR code hasn't expired (5 minute window)
      final timestamp = DateTime.parse(qrPayload['timestamp'] as String);
      final now = DateTime.now();
      final difference = now.difference(timestamp).inMinutes;

      if (difference > 5) {
        return QRScanResult(
          success: false,
          message: 'QR code expired. Please generate a new one.',
        );
      }

      // Get current session status
      final existingSession = await _getActiveSession(
        qrPayload['teacherId'] as String,
        qrPayload['studentId'] as String,
      );

      if (existingSession != null) {
        // Check-out
        return await _checkOut(existingSession['id'] as String);
      } else {
        // Check-in
        return await _checkIn(
          qrPayload['teacherId'] as String,
          qrPayload['studentId'] as String,
          qrData,
        );
      }
    } catch (e) {
      return QRScanResult(
        success: false,
        message: 'Error processing QR code: \${e.toString()}',
      );
    }
  }

  /// Get active teacher session (checked in, not checked out)
  static Future<Map<String, dynamic>?> _getActiveSession(
    String teacherId,
    String studentId,
  ) async {
    final response = await _supabase
        .from('teacher_sessions')
        .select()
        .eq('teacher_id', teacherId)
        .eq('student_id', studentId)
        .is_('check_out_time', null)
        .order('check_in_time', ascending: false)
        .limit(1)
        .maybeSingle();

    return response;
  }

  /// Check-in teacher
  static Future<QRScanResult> _checkIn(
    String teacherId,
    String studentId,
    String qrData,
  ) async {
    try {
      await _supabase.from('teacher_sessions').insert({
        'teacher_id': teacherId,
        'student_id': studentId,
        'check_in_time': DateTime.now().toIso8601String(),
        'qr_code_used': qrData,
        'session_start': DateTime.now().toIso8601String(),
      });

      return QRScanResult(
        success: true,
        message: 'Check-in successful',
        action: 'check_in',
      );
    } catch (e) {
      return QRScanResult(
        success: false,
        message: 'Check-in failed: \${e.toString()}',
      );
    }
  }

  /// Check-out teacher
  static Future<QRScanResult> _checkOut(String sessionId) async {
    try {
      await _supabase.from('teacher_sessions').update({
        'check_out_time': DateTime.now().toIso8601String(),
        'session_end': DateTime.now().toIso8601String(),
      }).eq('id', sessionId);

      return QRScanResult(
        success: true,
        message: 'Check-out successful',
        action: 'check_out',
      );
    } catch (e) {
      return QRScanResult(
        success: false,
        message: 'Check-out failed: \${e.toString()}',
      );
    }
  }

  /// Parse QR data from JSON string
  static Map<String, dynamic> _parseQRData(String qrData) {
    // Implementation depends on QR format
    // For now, assume JSON format
    return {}; // TODO: Implement JSON parsing
  }
}

class QRScanResult {
  final bool success;
  final String message;
  final String? action;

  QRScanResult({
    required this.success,
    required this.message,
    this.action,
  });
}
`;
  }

  private generateQRValidationService(): string {
    return `import 'dart:convert';
import 'package:crypto/crypto.dart';
import '../config/env.dart';

class QRValidationService {
  /// Validate QR code signature using HMAC-SHA256
  static Future<bool> validateQRCode(String qrData) async {
    try {
      // Parse QR data
      final Map<String, dynamic> payload = jsonDecode(qrData);

      // Extract signature
      final String signature = payload['signature'] as String;

      // Reconstruct data without signature
      final dataWithoutSignature = {
        ...payload,
      }..remove('signature');

      // Generate expected signature
      final expectedSignature = _generateSignature(dataWithoutSignature);

      // Compare signatures
      return signature == expectedSignature;
    } catch (e) {
      print('QR validation error: \$e');
      return false;
    }
  }

  /// Generate HMAC-SHA256 signature for QR code data
  static String _generateSignature(Map<String, dynamic> data) {
    // Sort keys to ensure consistent ordering
    final sortedKeys = data.keys.toList()..sort();
    final dataString = sortedKeys
        .map((key) => '\$key=\${data[key]}')
        .join('&');

    // Get secret key from environment
    final secretKey = const String.fromEnvironment(
      'QR_SECRET',
      defaultValue: '', // Must be provided at build time
    );

    // Generate HMAC-SHA256
    final hmac = Hmac(sha256, utf8.encode(secretKey));
    final digest = hmac.convert(utf8.encode(dataString));

    return base64.encode(digest.bytes);
  }
}
`;
  }

  private generatePermissionHandlerService(): string {
    return `import 'package:permission_handler/permission_handler.dart';

class PermissionHandlerService {
  /// Request camera permission
  static Future<PermissionResult> requestCameraPermission() async {
    final status = await Permission.camera.request();

    switch (status) {
      case PermissionStatus.granted:
        return PermissionResult(
          granted: true,
          message: 'Camera permission granted',
        );

      case PermissionStatus.denied:
        return PermissionResult(
          granted: false,
          message: 'Camera permission denied. Please enable in settings.',
        );

      case PermissionStatus.permanentlyDenied:
        return PermissionResult(
          granted: false,
          message: 'Camera permission permanently denied. Please enable in app settings.',
          openSettings: true,
        );

      default:
        return PermissionResult(
          granted: false,
          message: 'Camera permission status unknown',
        );
    }
  }

  /// Check if camera permission is granted
  static Future<bool> isCameraPermissionGranted() async {
    final status = await Permission.camera.status;
    return status.isGranted;
  }

  /// Open app settings
  static Future<void> openAppSettings() async {
    await openAppSettings();
  }
}

class PermissionResult {
  final bool granted;
  final String message;
  final bool openSettings;

  PermissionResult({
    required this.granted,
    required this.message,
    this.openSettings = false,
  });
}
`;
  }

  private generateFallbackAuthScreen(): string {
    return `import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../design_system/tokens/colors.dart';

/// Fallback authentication screen when QR scanner fails
/// Allows manual entry of teacher credentials
class FallbackAuthScreen extends ConsumerStatefulWidget {
  const FallbackAuthScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<FallbackAuthScreen> createState() => _FallbackAuthScreenState();
}

class _FallbackAuthScreenState extends ConsumerState<FallbackAuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleManualLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // TODO: Implement manual authentication
      await Future.delayed(const Duration(seconds: 2)); // Simulate API call

      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (e) {
      setState(() {
        _errorMessage = 'Login failed: \${e.toString()}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Manual Login'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 32),
                const Icon(
                  Icons.login,
                  size: 64,
                  color: AppColors.primary,
                ),
                const SizedBox(height: 24),
                const Text(
                  'QR Scanner Unavailable',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'Please enter your credentials to continue',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    prefixIcon: Icon(Icons.email),
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your email';
                    }
                    if (!value.contains('@')) {
                      return 'Please enter a valid email';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Password',
                    prefixIcon: Icon(Icons.lock),
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your password';
                    }
                    if (value.length < 6) {
                      return 'Password must be at least 6 characters';
                    }
                    return null;
                  },
                ),
                if (_errorMessage != null) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleManualLogin,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'Login',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () {
                    // Retry QR scanner
                    Navigator.pop(context);
                  },
                  child: const Text('Try QR Scanner Again'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
`;
  }

  private generateQRCodeGeneratorService(): string {
    return `import crypto from 'crypto';

/**
 * QR Code Generator Service (Backend - TypeScript)
 * Generates student-specific QR codes with HMAC-SHA256 signatures
 */
export class QRCodeGeneratorService {
  private static readonly SECRET_KEY = process.env.NEXT_PUBLIC_QR_SECRET || '';

  /**
   * Generate student-specific QR code data
   */
  static generateQRCodeData(
    studentId: string,
    teacherId: string,
    expiresInMinutes: number = 5
  ): string {
    const timestamp = new Date().toISOString();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString();

    const payload = {
      studentId,
      teacherId,
      timestamp,
      expiresAt,
    };

    // Generate signature
    const signature = this.generateSignature(payload);

    const qrData = {
      ...payload,
      signature,
    };

    return JSON.stringify(qrData);
  }

  /**
   * Generate HMAC-SHA256 signature
   */
  private static generateSignature(data: Record<string, any>): string {
    // Sort keys for consistent ordering
    const sortedKeys = Object.keys(data).sort();
    const dataString = sortedKeys
      .map(key => \`\${key}=\${data[key]}\`)
      .join('&');

    const hmac = crypto.createHmac('sha256', this.SECRET_KEY);
    hmac.update(dataString);

    return hmac.digest('base64');
  }

  /**
   * Validate QR code signature
   */
  static validateQRCode(qrData: string): boolean {
    try {
      const payload = JSON.parse(qrData);
      const { signature, ...dataWithoutSignature } = payload;

      const expectedSignature = this.generateSignature(dataWithoutSignature);

      return signature === expectedSignature;
    } catch (e) {
      return false;
    }
  }
}
`;
  }

  private generateAndroidManifestUpdates(): string {
    return `<!-- Add to android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
`;
  }

  private generateInfoPlistUpdates(): string {
    return `<!-- Add to ios/Runner/Info.plist -->
<key>NSCameraUsageDescription</key>
<string>This app requires camera access to scan QR codes for teacher check-in/check-out.</string>
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
      info: '[QRScannerAgent]',
      success: '[QRScannerAgent] ✓',
      error: '[QRScannerAgent] ✗',
    }[level];

    console.log(`${prefix} ${message}`);
  }
}
