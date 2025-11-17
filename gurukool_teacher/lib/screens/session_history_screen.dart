import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:gurukool_teacher/design_system/tokens/colors.dart';
import 'package:gurukool_teacher/design_system/tokens/spacing.dart';
import 'package:gurukool_teacher/design_system/tokens/typography.dart';
import 'package:gurukool_teacher/providers/auth_provider.dart';
import 'package:intl/intl.dart';

/// Session History Screen - View past teaching sessions
class SessionHistoryScreen extends ConsumerStatefulWidget {
  const SessionHistoryScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<SessionHistoryScreen> createState() =>
      _SessionHistoryScreenState();
}

class _SessionHistoryScreenState extends ConsumerState<SessionHistoryScreen> {
  List<Map<String, dynamic>> _sessions = [];
  bool _isLoading = true;
  String _filter = 'all'; // all, active, completed

  @override
  void initState() {
    super.initState();
    _loadSessions();
  }

  Future<void> _loadSessions() async {
    setState(() => _isLoading = true);

    try {
      final user = ref.read(currentUserProvider);
      if (user == null) return;

      late final List<Map<String, dynamic>> data;

      if (_filter == 'active') {
        data = await Supabase.instance.client
            .from('teacher_sessions')
            .select('*, students(*)')
            .eq('teacher_id', user.id)
            .isFilter('session_end', null)
            .order('created_at', ascending: false);
      } else if (_filter == 'completed') {
        data = await Supabase.instance.client
            .from('teacher_sessions')
            .select('*, students(*)')
            .eq('teacher_id', user.id)
            .not('session_end', 'is', null)
            .order('created_at', ascending: false);
      } else {
        data = await Supabase.instance.client
            .from('teacher_sessions')
            .select('*, students(*)')
            .eq('teacher_id', user.id)
            .order('created_at', ascending: false);
      }

      setState(() {
        _sessions = List<Map<String, dynamic>>.from(data);
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error loading sessions: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.gray_50,
      appBar: AppBar(
        title: const Text('Session History'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSessions,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter tabs
          Container(
            color: Colors.white,
            child: Row(
              children: [
                _buildFilterTab('All', 'all'),
                _buildFilterTab('Active', 'active'),
                _buildFilterTab('Completed', 'completed'),
              ],
            ),
          ),

          // Session list
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _sessions.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadSessions,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(Spacing.md),
                          itemCount: _sessions.length,
                          itemBuilder: (context, index) {
                            return _buildSessionCard(_sessions[index]);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTab(String label, String value) {
    final isSelected = _filter == value;

    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() => _filter = value);
          _loadSessions();
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: Spacing.md),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: isSelected ? AppColors.primary : Colors.transparent,
                width: 3,
              ),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: AppTypography.textTheme.labelLarge?.copyWith(
              color: isSelected ? AppColors.primary : AppColors.gray600,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSessionCard(Map<String, dynamic> session) {
    final student = session['students'] as Map<String, dynamic>?;
    final sessionStart = DateTime.parse(session['session_start']);
    final sessionEnd = session['session_end'] != null
        ? DateTime.parse(session['session_end'])
        : null;
    final isActive = sessionEnd == null;
    final duration = sessionEnd != null
        ? sessionEnd.difference(sessionStart)
        : DateTime.now().difference(sessionStart);

    return Card(
      margin: const EdgeInsets.only(bottom: Spacing.md),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () => _showSessionDetails(session),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(Spacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: isActive
                        ? AppColors.success.withOpacity(0.1)
                        : AppColors.gray_100,
                    child: Icon(
                      Icons.person,
                      color: isActive ? AppColors.success : AppColors.gray600,
                    ),
                  ),
                  const SizedBox(width: Spacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          student?['name'] ?? 'Unknown Student',
                          style: AppTypography.textTheme.titleMedium,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          DateFormat('MMM dd, yyyy - hh:mm a')
                              .format(sessionStart),
                          style: AppTypography.textTheme.bodySmall?.copyWith(
                            color: AppColors.gray600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  _buildStatusBadge(isActive),
                ],
              ),

              const SizedBox(height: Spacing.md),

              // Duration and location
              Row(
                children: [
                  Icon(
                    Icons.access_time,
                    size: 16,
                    color: AppColors.gray600,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _formatDuration(duration),
                    style: AppTypography.textTheme.bodySmall?.copyWith(
                      color: AppColors.gray600,
                    ),
                  ),
                  const SizedBox(width: Spacing.md),
                  Icon(
                    Icons.location_on,
                    size: 16,
                    color: AppColors.gray600,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      session['location'] ?? 'No location',
                      style: AppTypography.textTheme.bodySmall?.copyWith(
                        color: AppColors.gray600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),

              // Check-out button for active sessions
              if (isActive) ...[
                const SizedBox(height: Spacing.md),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _checkOut(session['id']),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.error,
                      padding: const EdgeInsets.symmetric(
                        vertical: Spacing.sm,
                      ),
                    ),
                    child: const Text('Check Out'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(bool isActive) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.sm,
        vertical: 4,
      ),
      decoration: BoxDecoration(
        color: isActive
            ? AppColors.success.withOpacity(0.1)
            : AppColors.gray_100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive
              ? AppColors.success.withOpacity(0.3)
              : AppColors.gray_300,
        ),
      ),
      child: Text(
        isActive ? 'Active' : 'Completed',
        style: AppTypography.textTheme.labelSmall?.copyWith(
          color: isActive ? AppColors.success : AppColors.gray600,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.history,
            size: 80,
            color: AppColors.gray_300,
          ),
          const SizedBox(height: Spacing.md),
          Text(
            'No sessions found',
            style: AppTypography.textTheme.titleLarge,
          ),
          const SizedBox(height: Spacing.sm),
          Text(
            'Your teaching sessions will appear here',
            style: AppTypography.textTheme.bodyMedium?.copyWith(
              color: AppColors.gray600,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDuration(Duration duration) {
    final hours = duration.inHours;
    final minutes = duration.inMinutes.remainder(60);

    if (hours > 0) {
      return '${hours}h ${minutes}m';
    } else {
      return '${minutes}m';
    }
  }

  Future<void> _checkOut(String sessionId) async {
    try {
      await Supabase.instance.client
          .from('teacher_sessions')
          .update({
            'session_end': DateTime.now().toIso8601String(),
          })
          .eq('id', sessionId);

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Checked out successfully'),
          backgroundColor: AppColors.success,
        ),
      );

      _loadSessions();
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  void _showSessionDetails(Map<String, dynamic> session) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) {
          final student = session['students'] as Map<String, dynamic>?;
          final sessionStart = DateTime.parse(session['session_start']);
          final sessionEnd = session['session_end'] != null
              ? DateTime.parse(session['session_end'])
              : null;

          return SingleChildScrollView(
            controller: scrollController,
            padding: const EdgeInsets.all(Spacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.gray_300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: Spacing.lg),

                // Title
                Text(
                  'Session Details',
                  style: AppTypography.textTheme.headlineSmall,
                ),
                const SizedBox(height: Spacing.xl),

                // Student info
                _buildDetailRow('Student', student?['name'] ?? 'Unknown'),
                _buildDetailRow(
                  'Check-in',
                  DateFormat('MMM dd, yyyy - hh:mm a').format(sessionStart),
                ),
                if (sessionEnd != null)
                  _buildDetailRow(
                    'Check-out',
                    DateFormat('MMM dd, yyyy - hh:mm a').format(sessionEnd),
                  ),
                _buildDetailRow('Location', session['location'] ?? 'N/A'),
                if (session['notes'] != null)
                  _buildDetailRow('Notes', session['notes']),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: AppTypography.textTheme.labelSmall?.copyWith(
              color: AppColors.gray600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: AppTypography.textTheme.bodyLarge,
          ),
        ],
      ),
    );
  }
}
