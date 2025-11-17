# QR Code Quick Reference

## 🚀 Quick Start

### Generate QR Code (Authentication)

```typescript
import { qrAuthService } from '@/services/qr-auth.service';

const qrCode = await qrAuthService.generateQRToken(email, role);
// Returns: data:image/png;base64,iVBORw0KGgo...
```

### Generate QR Code (Generic)

```typescript
import { QRCodeGenerator } from '@/utils/qr-code-generator';

const qrCode = await QRCodeGenerator.generateQRCode(email, password);
// Returns: data:image/png;base64,iVBORw0KGgo...
```

### Generate iOS-Optimized QR Code

```typescript
import { QRCodeGenerator } from '@/utils/qr-code-generator';

const qrCode = await QRCodeGenerator.generateIOSOptimizedQRCode(data);
// Returns: data:image/png;base64,iVBORw0KGgo...
```

---

## ✅ Validation

### Check if Real QR Code

```typescript
const isRealQR = qrCode.startsWith('data:image/png;base64,');
// Should be true

const isFakeQR = qrCode.startsWith('data:image/svg+xml;base64,');
// Should be false
```

### Verify QR Code Format

```typescript
if (!qrCode.startsWith('data:image/png;base64,')) {
  throw new Error('Not a real QR code!');
}
```

---

## 🎨 Display QR Code

### In React Component

```typescript
<img
  src={qrCode}
  alt="QR Code"
  className="w-64 h-64"
/>
```

### With Error Handling

```typescript
<img
  src={qrCode}
  alt="QR Code"
  onError={(e) => {
    console.error('QR code failed to load');
    e.currentTarget.src = fallbackQRCode;
  }}
/>
```

---

## 🔧 iOS Settings

### Optimal Configuration

```typescript
{
  errorCorrectionLevel: 'H',  // Highest (30% recovery)
  type: 'image/png',          // PNG format
  quality: 1,                 // Maximum quality
  margin: 4,                  // Adequate quiet zone
  width: 512,                 // Optimal size
  color: {
    dark: '#000000',          // Pure black
    light: '#FFFFFF',         // Pure white
  },
}
```

---

## 🧪 Testing

### Test Page URLs

```
/test-qr          - Simple QR generation test
/test/qr          - Comprehensive QR tester
/auth/qr          - Authentication QR flow
/admin/dashboard  - User creation with QR
```

### Quick Test

```typescript
// Generate test QR
const testQR = await QRCodeGenerator.generateQRCode(
  'test@example.com',
  'password123'
);

// Verify format
console.assert(
  testQR.startsWith('data:image/png;base64,'),
  'QR code should be PNG format'
);
```

---

## ⚠️ Common Mistakes

### ❌ DON'T: Use synchronous calls

```typescript
const qr = generateQRToken(email, role); // ERROR!
```

### ✅ DO: Use async/await

```typescript
const qr = await generateQRToken(email, role); // CORRECT!
```

### ❌ DON'T: Generate fake SVG QR codes

```typescript
const qr = `data:image/svg+xml;base64,${btoa('<svg>...')}`;
```

### ✅ DO: Use qrcode library

```typescript
import QRCode from 'qrcode';
const qr = await QRCode.toDataURL(data, options);
```

---

## 📊 Performance

### Expected Metrics

- Generation: <100ms
- iOS Recognition: <2 seconds
- Success Rate: >95%
- Distance: 10-50cm

### Optimization Tips

1. Use 512px width for iOS
2. Use error correction level 'H'
3. Use pure black/white colors
4. Include 4-module margin

---

## 🔍 Debugging

### Check QR Code Format

```typescript
console.log('Format:', qrCode.substring(0, 30));
// Should show: data:image/png;base64,iVBOR...
```

### Verify QR Code Size

```typescript
console.log('Size:', qrCode.length);
// Should be: 5000-20000 characters
```

### Test QR Code Generation

```typescript
try {
  const qr = await QRCodeGenerator.test();
  console.log('Test result:', qr);
} catch (error) {
  console.error('QR generation failed:', error);
}
```

---

## 📱 iOS Testing

### Quick iOS Test

1. Open `/test-qr` on desktop
2. Generate QR code
3. Scan with iPhone Camera app
4. Should recognize in <2 seconds

### iOS Compatibility

- ✅ iPhone 8+ (iOS 14+)
- ✅ iPhone 11+ (iOS 15+)
- ✅ iPhone 12+ (iOS 16+)
- ✅ iPad (all models)

---

## 🆘 Troubleshooting

### QR Code Not Displaying

```typescript
// Check if QR code is valid
if (!qrCode || qrCode.length < 100) {
  console.error('Invalid QR code');
}

// Check format
if (!qrCode.startsWith('data:image/')) {
  console.error('Invalid QR code format');
}
```

### QR Code Not Scanning

1. Verify format is PNG (not SVG)
2. Check error correction is 'H'
3. Ensure adequate margin (4)
4. Use pure black/white colors
5. Test at 20-30cm distance

---

## 📚 Reference

### Documentation

- Technical: `QR_CODE_IOS_FIX_REPORT.md`
- Testing: `QR_CODE_IOS_TESTING_GUIDE.md`
- Summary: `QR_CODE_FIX_SUMMARY.md`

### Reference Code

- `src/services/qr-auth.service.ts`
- `src/utils/qr-code-generator.ts`
- `src/services/teacher-qr.service.ts`

---

## 💡 Tips

1. **Always use async/await** for QR generation
2. **Verify PNG format** before displaying
3. **Test on actual iOS devices** before production
4. **Use error correction level 'H'** for iOS
5. **Include adequate margin** (4 modules)
6. **Use high contrast** (pure black/white)
7. **Optimize size** (512px for iOS)
8. **Handle errors gracefully** with fallbacks

---

## ✨ One-Liner Examples

```typescript
// Generate auth QR
const qr = await qrAuthService.generateQRToken(email, 'parent');

// Generate generic QR
const qr = await QRCodeGenerator.generateQRCode(email, password);

// Generate iOS-optimized QR
const qr = await QRCodeGenerator.generateIOSOptimizedQRCode(data);

// Verify format
const isValid = qr.startsWith('data:image/png;base64,');

// Display QR
<img src={qr} alt="QR Code" className="w-64 h-64" />
```

---

**Remember**: All QR codes are now REAL and iOS compatible! 🎉
