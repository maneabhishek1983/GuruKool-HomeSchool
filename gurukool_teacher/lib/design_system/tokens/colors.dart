import 'package:flutter/material.dart';

/// Auto-generated design tokens from Tailwind CSS
/// Updated to match GuruKool Web App theme exactly
/// DO NOT EDIT MANUALLY - use UI Designer Agent to update
class AppColors {
  // ===== PRIMARY BLUE - Trust, Knowledge, Professionalism =====
  static const primary = Color(0xFF2563EB);        // Blue 500 (main)
  static const primary50 = Color(0xFFEFF6FF);
  static const primary100 = Color(0xFFDBEAFE);
  static const primary200 = Color(0xFFBFDBFE);
  static const primary300 = Color(0xFF93C5FD);
  static const primary400 = Color(0xFF60A5FA);
  static const primary500 = primary;               // Alias to main
  static const primary600 = Color(0xFF1E40AF);
  static const primary700 = Color(0xFF1E3A8A);
  static const primary800 = Color(0xFF1E3A8A);
  static const primary900 = Color(0xFF1E3A8A);
  static const primary950 = Color(0xFF172554);
  static const primaryLight = Color(0xFF3B82F6);   // Blue 400
  static const primaryDark = Color(0xFF1E40AF);    // Blue 600

  // ===== SECONDARY TEAL - Growth, Learning, Freshness =====
  // ⚠️ CRITICAL FIX: Changed from #F59E0B (orange) to #14B8A6 (teal) to match web
  static const secondary = Color(0xFF14B8A6);      // Teal 500 (main) ✅ FIXED
  static const secondary50 = Color(0xFFF0FDFA);
  static const secondary100 = Color(0xFFCCFBF1);
  static const secondary200 = Color(0xFF99F6E4);
  static const secondary300 = Color(0xFF5EEAD4);
  static const secondary400 = Color(0xFF2DD4BF);
  static const secondary500 = secondary;           // Alias to main
  static const secondary600 = Color(0xFF0D9488);
  static const secondary700 = Color(0xFF0F766E);
  static const secondary800 = Color(0xFF115E59);
  static const secondary900 = Color(0xFF134E4A);
  static const secondary950 = Color(0xFF042F2E);
  static const secondaryLight = Color(0xFF2DD4BF);  // Teal 400
  static const secondaryDark = Color(0xFF0D9488);   // Teal 600

  // ===== ACCENT GOLD - Achievement, Excellence =====
  // This is what secondary was incorrectly set to before (#F59E0B)
  static const accent = Color(0xFFF59E0B);         // Amber 500 (main)
  static const accent50 = Color(0xFFFFFBEB);
  static const accent100 = Color(0xFFFEF3C7);
  static const accent200 = Color(0xFFFDE68A);
  static const accent300 = Color(0xFFFCD34D);
  static const accent400 = Color(0xFFFBBF24);
  static const accent500 = accent;                 // Alias to main
  static const accent600 = Color(0xFFD97706);
  static const accent700 = Color(0xFFB45309);
  static const accent800 = Color(0xFF92400E);
  static const accent900 = Color(0xFF78350F);
  static const accent950 = Color(0xFF451A03);
  static const accentLight = Color(0xFFFBBF24);
  static const accentDark = Color(0xFFD97706);

  // ===== SEMANTIC COLORS =====
  static const success = Color(0xFF10B981);        // Green 500
  static const success50 = Color(0xFFF0FDF4);
  static const success100 = Color(0xFFDCFCE7);
  static const success500 = success;
  static const success600 = Color(0xFF16A34A);

  static const error = Color(0xFFEF4444);          // Red 500
  static const error50 = Color(0xFFFEF2F2);
  static const error100 = Color(0xFFFEE2E2);
  static const error500 = error;
  static const error600 = Color(0xFFDC2626);

  static const warning = Color(0xFFF59E0B);        // Amber 500 (same as accent)
  static const warning50 = Color(0xFFFFFBEB);
  static const warning100 = Color(0xFFFEF3C7);
  static const warning500 = warning;
  static const warning600 = Color(0xFFD97706);

  static const info = Color(0xFF3B82F6);           // Blue 400
  static const info50 = Color(0xFFEFF6FF);
  static const info100 = Color(0xFFDBEAFE);
  static const info500 = info;
  static const info600 = Color(0xFF2563EB);

  // ===== NEUTRAL GRAYS =====
  static const gray50 = Color(0xFFF9FAFB);
  static const gray100 = Color(0xFFF3F4F6);
  static const gray200 = Color(0xFFE5E7EB);
  static const gray300 = Color(0xFFD1D5DB);
  static const gray400 = Color(0xFF9CA3AF);       // ✅ NEW - Added missing shade
  static const gray500 = Color(0xFF6B7280);       // ✅ NEW - Added missing shade
  static const gray600 = Color(0xFF4B5563);
  static const gray700 = Color(0xFF374151);       // ✅ NEW - Added missing shade
  static const gray800 = Color(0xFF1F2937);       // ✅ NEW - Added missing shade
  static const gray900 = Color(0xFF111827);

  // ===== BACKWARD COMPATIBILITY ALIASES =====
  static const gray_50 = gray50;
  static const gray_100 = gray100;
  static const gray_300 = gray300;
  static const gray_400 = gray400;
  static const gray_500 = gray500;
  static const gray_600 = gray600;
  static const gray_700 = gray700;
  static const gray_800 = gray800;
  static const gray_900 = gray900;

  static const primary_light = primaryLight;
  static const primary_dark = primaryDark;
}
