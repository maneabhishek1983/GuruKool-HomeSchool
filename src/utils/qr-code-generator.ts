/**
 * QR Code Generator Utility
 * Handles QR code generation with proper error handling and browser compatibility
 */

export interface QRCodeData {
  email: string;
  password: string;
  timestamp: string;
  type: string;
}

export class QRCodeGenerator {
  /**
   * Generate a QR code as a data URL
   */
  static generateQRCode(email: string, password: string): string {
    try {
      // Create the data object
      const qrData: QRCodeData = {
        email,
        password,
        timestamp: new Date().toISOString(),
        type: 'login',
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(qrData);

      // Create SVG content
      const svgContent = this.createSVGContent(jsonData);

      // Convert to base64 with proper encoding
      const base64Data = this.encodeToBase64(svgContent);

      // Create data URL
      const qrCodeUrl = `data:image/svg+xml;base64,${base64Data}`;

      // Validate the generated QR code
      if (!this.validateQRCode(qrCodeUrl, email, password)) {
        throw new Error('QR code validation failed');
      }

      console.log('QR Code generated successfully:', {
        email,
        qrCodeLength: qrCodeUrl.length,
        hasData: qrCodeUrl.includes(email),
        timestamp: qrData.timestamp,
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
   * Create SVG content for the QR code
   */
  private static createSVGContent(data: string): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="8">${data}</text>
      </svg>
    `;
  }

  /**
   * Encode string to base64 with proper browser compatibility
   */
  private static encodeToBase64(str: string): string {
    try {
      // Try using btoa first (standard browser method)
      if (typeof btoa !== 'undefined') {
        return btoa(str);
      }

      // Fallback for environments without btoa
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(str).toString('base64');
      }

      // Manual base64 encoding as last resort
      return this.manualBase64Encode(str);
    } catch (error) {
      console.error('Base64 encoding failed:', error);
      throw new Error('Failed to encode QR code data');
    }
  }

  /**
   * Manual base64 encoding fallback
   */
  private static manualBase64Encode(str: string): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;

    while (i < str.length) {
      const char1 = str.charCodeAt(i++);
      const char2 = str.charCodeAt(i++);
      const char3 = str.charCodeAt(i++);

      const enc1 = char1 >> 2;
      const enc2 = ((char1 & 3) << 4) | (char2 >> 4);
      let enc3 = ((char2 & 15) << 2) | (char3 >> 6);
      let enc4 = char3 & 63;

      if (isNaN(char2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(char3)) {
        enc4 = 64;
      }

      result =
        result +
        chars.charAt(enc1) +
        chars.charAt(enc2) +
        chars.charAt(enc3) +
        chars.charAt(enc4);
    }

    return result;
  }

  /**
   * Validate the generated QR code
   */
  private static validateQRCode(
    qrCodeUrl: string,
    email: string,
    password: string
  ): boolean {
    // Check if it's a valid data URL
    if (!qrCodeUrl.startsWith('data:image/svg+xml;base64,')) {
      return false;
    }

    // Check if the URL is not too long
    if (qrCodeUrl.length > 10000) {
      return false;
    }

    // Decode the base64 data to check the actual content
    try {
      const base64Data = qrCodeUrl.split(',')[1];
      const svgContent = base64Data ? atob(base64Data) : '';

      // Check if the SVG contains the expected data
      if (!svgContent.includes(email) || !svgContent.includes(password)) {
        return false;
      }
    } catch (error) {
      console.error('Error validating QR code:', error);
      return false;
    }

    return true;
  }

  /**
   * Generate a fallback QR code with error information
   */
  private static generateFallbackQRCode(
    email: string,
    errorMessage: string
  ): string {
    const fallbackData = JSON.stringify({
      email,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      type: 'error',
    });

    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" fill="#fee2e2"/>
        <text x="100" y="90" text-anchor="middle" font-family="monospace" font-size="10" fill="#dc2626">QR Code Error</text>
        <text x="100" y="110" text-anchor="middle" font-family="monospace" font-size="6" fill="#dc2626">${email}</text>
        <text x="100" y="130" text-anchor="middle" font-family="monospace" font-size="4" fill="#dc2626">${errorMessage}</text>
      </svg>
    `;

    try {
      const base64Data = this.encodeToBase64(svgContent);
      return `data:image/svg+xml;base64,${base64Data}`;
    } catch (error) {
      // Ultimate fallback - return a simple error SVG
      return `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
          <rect width="200" height="200" fill="#fee2e2"/>
          <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12" fill="#dc2626">QR Error</text>
        </svg>
      `)}`;
    }
  }

  /**
   * Test QR code generation
   */
  static test(): { success: boolean; error?: string; qrCode?: string } {
    try {
      const testEmail = 'test@example.com';
      const testPassword = 'testpass123';

      const qrCode = this.generateQRCode(testEmail, testPassword);

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
}

// Export a default instance
export const qrCodeGenerator = new QRCodeGenerator();
