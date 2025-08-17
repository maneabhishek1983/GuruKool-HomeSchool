export interface QRToken {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  used: boolean;
}

class QRAuthService {
  private tokens: Map<string, QRToken> = new Map();

  generateQRToken(email: string, role: string): string {
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

    // Return QR code data URL
    const qrData = JSON.stringify({
      token: tokenId,
      email,
      role,
      timestamp: new Date().toISOString(),
    });

    return `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="8">${qrData}</text>
      </svg>
    `)}`;
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
      if (new Date(token.expiresAt) < now) {
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
