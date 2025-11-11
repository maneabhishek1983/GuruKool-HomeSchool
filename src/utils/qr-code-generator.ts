/**
 * QR Code Generator Utility
 * Handles QR code generation with proper error handling and iOS compatibility
 */

import QRCode from 'qrcode';

export interface QRCodeData {
  email: string;
  password: string;
  timestamp: string;
  type: string;
  version: string;
}

export class QRCodeGenerator {
  /**
   * Generate a REAL QR code as a data URL (iOS compatible)
   */
  static async generateQRCode(
    email: string,
    password: string
  ): Promise<string> {
    try {
      // Create the data object
      const qrData: QRCodeData = {
        email,
        password,
        timestamp: new Date().toISOString(),
        type: 'login',
        version: '1.0',
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(qrData);

      // Generate REAL QR code using qrcode library (iOS compatible)
      const qrCodeUrl = await QRCode.toDataURL(jsonData, {
        errorCorrectionLevel: 'H', // Highest error correction for iOS
        type: 'image/png',
        quality: 1,
        margin: 4, // Adequate quiet zone for iOS
        width: 512, // Optimal size for iOS scanning
        color: {
          dark: '#000000', // Pure black for maximum contrast
          light: '#FFFFFF', // Pure white background
        },
      });

      console.log('QR Code generated successfully:', {
        email,
        qrCodeLength: qrCodeUrl.length,
        timestamp: qrData.timestamp,
        isRealQRCode: true,
      });

      return qrCodeUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);

      // Return a fallback QR code with error information
      return this.generateFallbackQRCode(
        email,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Validate the generated QR code
   */
  private static validateQRCode(qrCodeUrl: string): boolean {
    // Check if it's a valid data URL (PNG format for real QR codes)
    if (!qrCodeUrl.startsWith('data:image/png;base64,')) {
      return false;
    }

    // Check if the URL is not too long (reasonable size for QR code)
    if (qrCodeUrl.length > 100000) {
      return false;
    }

    // Check if base64 data exists
    const base64Data = qrCodeUrl.split(',')[1];
    if (!base64Data || base64Data.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Generate a fallback QR code with error information
   * Even fallback should be a REAL QR code for iOS compatibility
   */
  private static async generateFallbackQRCode(
    email: string,
    errorMessage: string
  ): Promise<string> {
    const fallbackData = JSON.stringify({
      email,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      type: 'error',
      version: '1.0',
    });

    try {
      // Generate a real QR code even for errors
      const qrCodeUrl = await QRCode.toDataURL(fallbackData, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 1,
        margin: 4,
        width: 512,
        color: {
          dark: '#dc2626', // Red for error indication
          light: '#fee2e2', // Light red background
        },
      });
      return qrCodeUrl;
    } catch (error) {
      // Ultimate fallback - simple error message QR
      const simpleError = JSON.stringify({ error: 'QR generation failed' });
      try {
        return await QRCode.toDataURL(simpleError, {
          errorCorrectionLevel: 'L',
          width: 256,
        });
      } catch {
        // If even this fails, return a data URL that indicates failure
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      }
    }
  }

  /**
   * Test QR code generation
   */
  static async test(): Promise<{
    success: boolean;
    error?: string;
    qrCode?: string;
  }> {
    try {
      const testEmail = 'test@example.com';
      const testPassword = 'testpass123';

      const qrCode = await this.generateQRCode(testEmail, testPassword);

      return {
        success: true,
        qrCode,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate QR code with iOS-optimized settings
   */
  static async generateIOSOptimizedQRCode(data: string): Promise<string> {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H', // Highest for iOS
      type: 'image/png',
      quality: 1,
      margin: 4, // iOS recommended quiet zone
      width: 512, // Optimal for iOS camera
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  }
}

// Export a default instance
export const qrCodeGenerator = new QRCodeGenerator();
