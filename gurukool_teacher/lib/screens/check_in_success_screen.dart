import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:gurukool_teacher/design_system/tokens/colors.dart';
import 'package:gurukool_teacher/design_system/tokens/spacing.dart';
import 'package:gurukool_teacher/design_system/tokens/typography.dart';

/// Check-In Success Screen - Confirms successful session check-in
class CheckInSuccessScreen extends StatelessWidget {
  final Map<String, dynamic>? sessionData;

  const CheckInSuccessScreen({
    Key? key,
    this.sessionData,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final studentId = sessionData?['student_id'] ?? 'Unknown';
    final checkInTime = sessionData?['session_start'] != null
        ? DateTime.parse(sessionData!['session_start'] as String)
        : DateTime.now();
    final location = sessionData?['location'] ?? 'No location';

    return Scaffold(
      backgroundColor: AppColors.gray50,
      appBar: AppBar(
        title: const Text('Check-In Successful'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(Spacing.xl),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Success icon
              Icon(
                Icons.check_circle,
                size: 120,
                color: AppColors.success,
              ),
              const SizedBox(height: Spacing.xl),

              // Success message
              Text(
                'Check-In Successful!',
                style: AppTypography.textTheme.headlineMedium?.copyWith(
                  color: AppColors.gray900,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: Spacing.md),

              Text(
                'Your session has been started.',
                style: AppTypography.textTheme.bodyLarge?.copyWith(
                  color: AppColors.gray600,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: Spacing.xxl),

              // Session details card
              Container(
                padding: const EdgeInsets.all(Spacing.lg),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Session Details',
                      style: AppTypography.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: Spacing.md),

                    _buildDetailRow(
                      icon: Icons.person,
                      label: 'Student ID',
                      value: studentId,
                    ),
                    const SizedBox(height: Spacing.sm),

                    _buildDetailRow(
                      icon: Icons.access_time,
                      label: 'Check-In Time',
                      value: _formatTime(checkInTime),
                    ),
                    const SizedBox(height: Spacing.sm),

                    _buildDetailRow(
                      icon: Icons.location_on,
                      label: 'Location',
                      value: location,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: Spacing.xxl),

              // Action buttons
              ElevatedButton(
                onPressed: () => context.go('/session-history'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: Spacing.md),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('View Session History'),
              ),
              const SizedBox(height: Spacing.md),

              OutlinedButton(
                onPressed: () => context.go('/home'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: Spacing.md),
                  side: BorderSide(color: AppColors.primary),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text('Back to Home'),
              ),
              const SizedBox(height: Spacing.md),

              TextButton(
                onPressed: () => context.go('/qr-scanner'),
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.gray600,
                  padding: const EdgeInsets.symmetric(vertical: Spacing.md),
                ),
                child: const Text('Scan Another QR Code'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: Spacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: AppTypography.textTheme.bodySmall?.copyWith(
                  color: AppColors.gray600,
                ),
              ),
              Text(
                value,
                style: AppTypography.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')} ${time.day}/${time.month}/${time.year}';
  }
}
