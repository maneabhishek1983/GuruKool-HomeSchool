import QRCode from 'qrcode';

export interface QRToken {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  used: boolean;
}

class QRAuthService {
  private tokens: Map<string, QRToken> = new Map();

  async generateQRToken(email: string, role: string): Promise<string> {
    const tokenId = `qr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    const token: QRToken = {
      id: tokenId,
      email,
      role,
      expiresAt,
      used: false,
    };

    this.tokens.set(tokenId, token);

    // Create QR code data
    const qrData = JSON.stringify({
      token: tokenId,
      email,
      role,
      timestamp: new Date().toISOString(),
      version: '1.0',
    });

    try {
      // Generate REAL QR code using qrcode library (iOS compatible)
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
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

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  verifyQRToken(tokenId: string): QRToken | null {
    const token = this.tokens.get(tokenId);

    if (!token) {
      return null;
    }

    if (token.used) {
      return null;
    }

    if (new Date() > new Date(token.expiresAt)) {
      return null;
    }

    // Mark token as used
    token.used = true;
    this.tokens.set(tokenId, token);

    return token;
  }

  cleanupExpiredTokens() {
    const now = new Date();
    for (const [tokenId, token] of this.tokens.entries()) {
      // Delete expired tokens AND used tokens (they can't be reused)
      if (new Date(token.expiresAt) < now || token.used) {
        this.tokens.delete(tokenId);
      }
    }
  }
}

export const qrAuthService = new QRAuthService();

// Cleanup expired tokens every minute
setInterval(() => {
  qrAuthService.cleanupExpiredTokens();
}, 60000);

export default QRAuthService;
