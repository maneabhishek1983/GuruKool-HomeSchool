import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Auto-generated typography tokens from Tailwind CSS
/// Updated to match Material Design 3 complete type scale
/// Aligned with GuruKool Web App typography system
/// DO NOT EDIT MANUALLY - use UI Designer Agent to update
class AppTypography {
  static TextTheme textTheme = TextTheme(
    // ===== DISPLAY - Large headings, hero text =====
    displayLarge: GoogleFonts.inter(
      fontSize: 57,           // Tailwind text-6xl (3.75rem)
      fontWeight: FontWeight.w400,
      letterSpacing: -0.25,
    ),
    displayMedium: GoogleFonts.inter(
      fontSize: 45,           // Tailwind text-5xl (3rem)
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
    ),
    displaySmall: GoogleFonts.inter(
      fontSize: 36,           // Tailwind text-4xl (2.25rem)
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
    ),

    // ===== HEADLINE - Section headers =====
    headlineLarge: GoogleFonts.inter(
      fontSize: 32,           // Tailwind text-3xl (1.875rem adjusted)
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
    ),
    headlineMedium: GoogleFonts.inter(
      fontSize: 28,           // Tailwind text-2xl (1.5rem adjusted)
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
    ),
    headlineSmall: GoogleFonts.inter(
      fontSize: 24,           // Tailwind text-xl (1.25rem adjusted)
      fontWeight: FontWeight.w600,
      letterSpacing: 0,
    ),

    // ===== TITLE - Smaller headers, card titles =====
    titleLarge: GoogleFonts.inter(
      fontSize: 22,
      fontWeight: FontWeight.w500,
      letterSpacing: 0,
    ),
    titleMedium: GoogleFonts.inter(
      fontSize: 16,           // Tailwind text-base (1rem)
      fontWeight: FontWeight.w600,
      letterSpacing: 0.15,
    ),
    titleSmall: GoogleFonts.inter(
      fontSize: 14,           // Tailwind text-sm (0.875rem)
      fontWeight: FontWeight.w500,
      letterSpacing: 0.1,
    ),

    // ===== BODY - Main content text =====
    bodyLarge: GoogleFonts.inter(
      fontSize: 16,           // Tailwind text-base (1rem)
      fontWeight: FontWeight.w400,
      letterSpacing: 0.5,
    ),
    bodyMedium: GoogleFonts.inter(
      fontSize: 14,           // Tailwind text-sm (0.875rem)
      fontWeight: FontWeight.w400,
      letterSpacing: 0.25,
    ),
    bodySmall: GoogleFonts.inter(
      fontSize: 12,           // Tailwind text-xs (0.75rem)
      fontWeight: FontWeight.w400,
      letterSpacing: 0.4,
    ),

    // ===== LABEL - Buttons, form labels, captions =====
    labelLarge: GoogleFonts.inter(
      fontSize: 14,           // Tailwind text-sm (0.875rem)
      fontWeight: FontWeight.w500,
      letterSpacing: 0.1,
    ),
    labelMedium: GoogleFonts.inter(
      fontSize: 12,           // Tailwind text-xs (0.75rem)
      fontWeight: FontWeight.w500,
      letterSpacing: 0.5,
    ),
    labelSmall: GoogleFonts.inter(
      fontSize: 11,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.5,
    ),
  );
}
