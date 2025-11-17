# GuruKool HomeSchool - Flutter Mobile App Development Plan

## Executive Summary

**Project**: Flutter Mobile App for Teacher QR Check-In/Out
**Timeline**: 6 weeks (3-week MVP + 3-week enhanced features)
**Architecture**: Split Approach (Flutter mobile for teachers + Next.js web for parents/admins)
**Backend**: Shared Supabase (PostgreSQL + Auth + Realtime)
**Target Platforms**: iOS 14+, Android 8.0+

---

## Problem Statement

The Next.js web application's QR code scanner has **0% detection rate** on mobile Safari despite multiple fix attempts:

- **Issue**: TypeError during html5-qrcode initialization on mobile browsers
- **Root Cause**: Browser camera API limitations and library compatibility issues
- **Impact**: Teachers cannot check in/out using QR codes on mobile web

**Solution**: Build native Flutter mobile app with `mobile_scanner` package (95%+ detection rate on native iOS/Android cameras).

---

## Architecture Decision

### Split Approach (Chosen)

**Flutter Mobile App (Teacher-Facing)**:

- QR code scanning (native camera)
- Check-in/out flow
- Session history
- Timesheet summary
- Teacher profile

**Next.js Web App (Parent/Admin-Facing)**:

- Parent dashboard (student management, analytics)
- Admin portal (user management, system settings)
- Teacher invitation flow
- Reports and analytics

**Shared Backend**:

- Supabase (PostgreSQL + Auth + Realtime)
- Existing API endpoints (`/api/teacher-sessions/scan`)
- Database schema (no changes needed)

### Why Split Approach?

| Criteria               | Split Approach                            | Full Flutter Migration           |
| ---------------------- | ----------------------------------------- | -------------------------------- |
| **QR Detection Rate**  | 95%+ (native camera)                      | 95%+ (native camera)             |
| **Development Time**   | 6 weeks                                   | 4-8 months                       |
| **Web App Disruption** | None (keep existing web)                  | Complete rewrite                 |
| **Code Reuse**         | Backend only                              | Backend + business logic         |
| **User Impact**        | Teachers get mobile app, parents keep web | All users must adopt Flutter web |
| **Risk**               | Low (isolated mobile project)             | High (full platform migration)   |

---

## Pre-Development Checklist

### Tools & SDKs

- [ ] Flutter SDK 3.16.0+ installed (`flutter --version`)
- [ ] Dart SDK 3.2.0+ included with Flutter
- [ ] Android Studio installed (for Android development)
- [ ] Xcode installed (for iOS development, macOS only)
- [ ] VS Code with Flutter extension (or Android Studio with Flutter plugin)
- [ ] Git configured

### Apple Developer Setup (iOS)

- [ ] Apple Developer Account ($99/year) - [developer.apple.com](https://developer.apple.com)
- [ ] App ID created in App Store Connect (`com.gurukool.teacher`)
- [ ] Provisioning profiles and certificates configured
- [ ] TestFlight access enabled

### Google Play Setup (Android)

- [ ] Google Play Console account ($25 one-time fee) - [play.google.com/console](https://play.google.com/console)
- [ ] App created in Google Play Console (`com.gurukool.teacher`)
- [ ] Android keystore generated for release builds
- [ ] Internal testing track created

### Backend Access

- [ ] Supabase project access (`miqhtpbutevdrkyndflf.supabase.co`)
- [ ] Supabase anon key (for client-side RLS queries)
- [ ] API base URL (`https://gurukool-homeschool.vercel.app`)
- [ ] Database schema documentation reviewed

### Testing Devices

- [ ] Physical iOS device (iPhone 8+ running iOS 14+)
- [ ] Physical Android device (Android 8.0+)
- [ ] iOS Simulator configured
- [ ] Android Emulator configured

### Firebase (Optional for Week 4+)

- [ ] Firebase project created
- [ ] iOS app added to Firebase (`GoogleService-Info.plist`)
- [ ] Android app added to Firebase (`google-services.json`)
- [ ] Firebase Cloud Messaging enabled

---

## Week-by-Week Plan

### **Week 1: Authentication & Project Foundation**

#### Day 1: Project Setup

**Owner**: DevOps & Deployment Agent

**Tasks**:

1. Create Flutter project:

   ```bash
   flutter create gurukool_teacher
   cd gurukool_teacher
   ```

2. Set up folder structure:

   ```
   lib/
   ├── main.dart
   ├── config/
   │   ├── env.dart               # Environment variables
   │   └── routes.dart            # App routes
   ├── design_system/
   │   └── tokens/
   │       ├── colors.dart        # Color palette
   │       ├── spacing.dart       # Spacing scale
   │       └── typography.dart    # Text styles
   ├── models/
   │   ├── teacher_session.dart   # Session model
   │   └── user.dart              # User model
   ├── providers/
   │   ├── auth_provider.dart     # Auth state
   │   └── session_provider.dart  # Session state
   ├── screens/
   │   ├── auth/
   │   │   └── login_screen.dart
   │   ├── home/
   │   │   └── home_screen.dart
   │   └── qr_scanner/
   │       └── qr_scanner_screen.dart
   └── services/
       ├── supabase_service.dart  # Supabase client
       ├── auth_service.dart      # Authentication
       └── session_api_service.dart # Session API
   ```

3. Add dependencies to `pubspec.yaml`:

   ```yaml
   dependencies:
     flutter_riverpod: ^2.4.9
     supabase_flutter: ^2.3.4
     http: ^1.1.2
     mobile_scanner: ^3.5.5
     permission_handler: ^11.1.0
     google_fonts: ^6.1.0
     json_annotation: ^4.8.1
   ```

4. Initialize Git:
   ```bash
   git init
   git remote add origin <repository-url>
   git checkout -b develop
   ```

**Acceptance Criteria**:

- [ ] Flutter project runs on iOS simulator
- [ ] Flutter project runs on Android emulator
- [ ] No compilation errors

---

#### Day 2-3: Design System Migration

**Owner**: UI/UX Designer Agent

**Tasks**:

1. Extract design tokens from Next.js `src/config/theme.ts`
2. Create `lib/design_system/tokens/colors.dart` (see AI_AGENT_ARCHITECTURE.md → UI/UX Designer Agent → Example)
3. Create `lib/design_system/tokens/spacing.dart`
4. Create `lib/design_system/tokens/typography.dart` (using Google Fonts - Inter family)
5. Create `lib/design_system/theme.dart` for Material Theme
6. Design 3 screens: Login, Home, QR Scanner (Figma mockups or Flutter widget previews)

**Acceptance Criteria**:

- [ ] All design tokens migrated (colors, spacing, typography)
- [ ] Material Theme configured with brand colors
- [ ] 3 screen designs reviewed and approved by Orchestrator

---

#### Day 4-5: Supabase Authentication

**Owner**: Backend Integration Agent + State Management Agent

**Backend Integration Agent Tasks**:

1. Create `lib/services/supabase_service.dart` (see AI_AGENT_ARCHITECTURE.md → Backend Integration Agent → Supabase Client Setup)
2. Create `lib/services/auth_service.dart` (signIn, signOut, getCurrentUser)
3. Create `lib/models/user.dart` with JSON serialization
4. Test auth flow with demo credentials (`teacher@example.com` / `Demo@1234`)

**State Management Agent Tasks**:

1. Create `lib/providers/auth_provider.dart` (authStateProvider, authNotifierProvider)
2. Test state changes on login/logout

**UI/UX Designer Agent Tasks**:

1. Implement `lib/screens/auth/login_screen.dart` (email/password fields, login button, loading state)

**Testing & QA Agent Tasks**:

1. Write unit tests for `auth_service.dart` (`test/services/auth_service_test.dart`)
2. Write widget tests for `login_screen.dart` (`test/screens/auth/login_screen_test.dart`)

**Acceptance Criteria**:

- [ ] Email/password login works with Supabase
- [ ] JWT token stored securely (Flutter Secure Storage)
- [ ] Login screen UI matches design
- [ ] Unit tests pass (90%+ coverage on auth service)
- [ ] Widget tests pass (login screen)

**End of Week 1 Deliverable**: ✅ Working login/logout flow

---

### **Week 2: QR Scanner & Check-In Flow**

#### Day 1-3: Native QR Scanner Implementation

**Owner**: QR Scanner Specialist Agent + UI/UX Designer Agent

**QR Scanner Specialist Agent Tasks**:

1. Add camera permission handling (`permission_handler` package)
2. Create `lib/services/permission_service.dart` (request camera permission)
3. Implement `lib/screens/qr_scanner/qr_scanner_screen.dart` using `mobile_scanner` (see AI_AGENT_ARCHITECTURE.md → QR Scanner Specialist Agent)
4. Add scan area overlay (custom painter with corner brackets)
5. Test on physical iOS and Android devices
6. Measure detection rate (target: 95%+)

**UI/UX Designer Agent Tasks**:

1. Design QR scanner screen with camera viewfinder overlay
2. Design success animation (check mark, vibration feedback)
3. Design error states (camera permission denied, invalid QR code)

**Testing & QA Agent Tasks**:

1. Generate test QR codes (NEW format with HMAC-SHA256 signature)
2. Test detection on 3 devices (iOS, Android, different lighting conditions)
3. Log detection rate metrics

**Acceptance Criteria**:

- [ ] Camera permission requested correctly on iOS and Android
- [ ] QR scanner detects codes with 95%+ accuracy
- [ ] Scan area overlay visible
- [ ] Vibration feedback on successful scan
- [ ] Error handling for denied permissions

---

#### Day 4-5: Check-In/Out API Integration

**Owner**: Backend Integration Agent + State Management Agent + UI/UX Designer Agent

**Backend Integration Agent Tasks**:

1. Create `lib/models/teacher_session.dart` (see AI_AGENT_ARCHITECTURE.md → Backend Integration Agent → Data Model Generation)
2. Create `lib/services/session_api_service.dart` (scanQRCode method calling `/api/teacher-sessions/scan`)
3. Create `lib/services/qr_validation_service.dart` (parse and validate QR code format)
4. Test API endpoint with real teacher ID and QR data

**State Management Agent Tasks**:

1. Create `lib/providers/session_provider.dart` (sessionNotifierProvider)
2. Handle session state updates on check-in/out

**UI/UX Designer Agent Tasks**:

1. Design check-in success screen (session details, duration timer)
2. Design check-out confirmation dialog
3. Add location capture UI (optional field)

**Testing & QA Agent Tasks**:

1. Write integration test for full check-in flow (login → scan QR → check-in → verify session created)
2. Test offline scenario (scan QR while offline, verify queued for sync)

**Acceptance Criteria**:

- [ ] POST /api/teacher-sessions/scan returns session data
- [ ] Session state updated in Riverpod provider
- [ ] Check-in success screen displays session details
- [ ] Location captured if available (Geolocator package)
- [ ] Integration test passes

**End of Week 2 Deliverable**: ✅ Working QR check-in/out flow

---

### **Week 3: Session History & MVP Polish**

#### Day 1-2: Session History Screen

**Owner**: UI/UX Designer Agent + Backend Integration Agent

**UI/UX Designer Agent Tasks**:

1. Design session history screen (list of sessions with filters)
2. Design session card (student name, date, duration, status)
3. Design filter options (This Week, This Month, All Time)
4. Design empty state ("No sessions yet")

**Backend Integration Agent Tasks**:

1. Implement `getSessionHistory` method in `session_api_service.dart`
2. Add filtering by date range
3. Add sorting by session_start (descending)

**State Management Agent Tasks**:

1. Create `sessionListProvider` (FutureProvider.family with teacherId)
2. Implement filter state management

**Testing & QA Agent Tasks**:

1. Write widget tests for session history screen
2. Test with 0 sessions, 1 session, 100+ sessions

**Acceptance Criteria**:

- [ ] Session history loads from Supabase
- [ ] Filters work correctly (date range)
- [ ] Empty state displayed when no sessions
- [ ] Pagination works for 100+ sessions

---

#### Day 3-4: Timesheet Summary & Home Screen

**Owner**: UI/UX Designer Agent + Backend Integration Agent

**UI/UX Designer Agent Tasks**:

1. Design home screen (welcome message, quick stats, action buttons)
2. Design timesheet summary card (total hours this week/month)
3. Design bottom navigation bar (Home, History, Profile)

**Backend Integration Agent Tasks**:

1. Calculate total hours from session data
2. Create dashboard stats service

**Acceptance Criteria**:

- [ ] Home screen shows total hours this week/month
- [ ] Quick action button to open QR scanner
- [ ] Bottom navigation works (3 tabs)

---

#### Day 5: Testing, Bug Fixes, TestFlight/Google Play Submission

**Owner**: Testing & QA Agent + DevOps & Deployment Agent

**Testing & QA Agent Tasks**:

1. Run full test suite (unit + widget + integration)
2. Accessibility audit (WCAG 2.1 AA compliance)
3. Performance benchmarks (app startup <3s, QR scanner init <2s)
4. User acceptance testing with 3 teachers

**DevOps & Deployment Agent Tasks**:

1. Configure Fastlane for iOS and Android
2. Set up GitHub Actions CI/CD pipeline
3. Build release APK/IPA
4. Upload to TestFlight (iOS) and Google Play Internal Testing (Android)
5. Invite external testers (10 teachers)

**Acceptance Criteria**:

- [ ] All tests passing (unit, widget, integration)
- [ ] Code coverage ≥80%
- [ ] Accessibility audit passed
- [ ] App uploaded to TestFlight and Google Play Internal Testing
- [ ] 10 external testers invited

**End of Week 3 Deliverable**: ✅ MVP ready for external testing

---

### **Week 4: Offline Support**

#### Day 1-3: Offline Storage with Hive

**Owner**: State Management Agent + Backend Integration Agent

**Tasks**:

1. Add Hive dependencies (`hive`, `hive_flutter`)
2. Create `lib/services/hive_service.dart` (see AI_AGENT_ARCHITECTURE.md → State Management Agent)
3. Create Hive adapter for `TeacherSession` model
4. Cache sessions locally on load
5. Implement offline queue for check-in/out actions

**Acceptance Criteria**:

- [ ] Sessions cached locally (accessible offline)
- [ ] Check-in queued when offline
- [ ] Queue synced when online
- [ ] No data loss on network interruptions

---

#### Day 4-5: Offline Sync Service

**Owner**: State Management Agent + Backend Integration Agent

**Tasks**:

1. Create `lib/services/offline_sync_service.dart`
2. Implement connectivity monitoring (`connectivity_plus` package)
3. Auto-sync pending actions when network restored
4. Handle sync conflicts (server-wins strategy)
5. Add sync status indicator in UI

**Acceptance Criteria**:

- [ ] Pending actions synced automatically when online
- [ ] Sync conflicts resolved gracefully
- [ ] Sync status visible in UI ("Syncing...", "All synced")

---

### **Week 5: Push Notifications & GPS Tracking**

#### Day 1-3: Firebase Cloud Messaging

**Owner**: DevOps & Deployment Agent + Backend Integration Agent

**Tasks**:

1. Add Firebase to Flutter project (iOS + Android)
2. Configure Firebase Cloud Messaging (FCM)
3. Request notification permissions
4. Handle foreground and background notifications
5. Send test notifications from Firebase Console

**Acceptance Criteria**:

- [ ] Push notifications received on iOS and Android
- [ ] Notifications work in foreground and background
- [ ] User can enable/disable notifications in settings

---

#### Day 4-5: GPS Tracking

**Owner**: Backend Integration Agent + UI/UX Designer Agent

**Tasks**:

1. Add `geolocator` package
2. Request location permissions
3. Capture GPS coordinates on check-in
4. Display location in session details
5. Add map preview (optional, using Google Maps or OpenStreetMap)

**Acceptance Criteria**:

- [ ] GPS coordinates captured on check-in
- [ ] Location displayed in session history
- [ ] Permissions handled correctly

---

### **Week 6: Final Polish & Production Launch**

#### Day 1-2: Monthly Reports & Analytics

**Owner**: UI/UX Designer Agent + Backend Integration Agent

**Tasks**:

1. Design monthly report screen (total hours, sessions count, top students)
2. Add charts (pie chart, bar chart) using `fl_chart` package
3. Export report as PDF (optional)

**Acceptance Criteria**:

- [ ] Monthly report shows total hours and session count
- [ ] Charts display correctly
- [ ] Report can be exported (optional)

---

#### Day 3-4: Biometric Authentication

**Owner**: Backend Integration Agent + UI/UX Designer Agent

**Tasks**:

1. Add `local_auth` package
2. Implement Face ID / Touch ID / Fingerprint login
3. Add biometric toggle in settings
4. Fall back to password if biometric fails

**Acceptance Criteria**:

- [ ] Biometric login works on supported devices
- [ ] User can enable/disable in settings
- [ ] Falls back to password gracefully

---

#### Day 5: App Store & Play Store Submission

**Owner**: DevOps & Deployment Agent + Orchestrator Agent

**Tasks**:

1. Final QA review (Testing & QA Agent)
2. Update app store metadata (screenshots, description, keywords)
3. Submit to App Store review (iOS)
4. Promote to Production track (Android)
5. Monitor Sentry for crashes
6. Respond to user reviews

**Acceptance Criteria**:

- [ ] App Store submission approved (iOS)
- [ ] App live on Google Play Store (Android)
- [ ] No critical bugs in first 24 hours
- [ ] 4.5+ star rating target

**End of Week 6 Deliverable**: ✅ Production launch complete

---

## Success Metrics

### Week 1

- ✅ Login/logout flow working
- ✅ Design system migrated (colors, spacing, typography)
- ✅ Unit tests passing (auth service)

### Week 2

- ✅ QR scanner 95%+ detection rate
- ✅ Check-in/out API integration working
- ✅ Integration test passing (full check-in flow)

### Week 3 (MVP)

- ✅ Session history screen complete
- ✅ Timesheet summary showing total hours
- ✅ App uploaded to TestFlight and Google Play Internal Testing
- ✅ 10 external testers invited
- ✅ Code coverage ≥80%
- ✅ Accessibility audit passed

### Week 4-6 (Enhanced Features)

- ✅ Offline support working (Hive cache + sync queue)
- ✅ Push notifications working
- ✅ GPS tracking capturing location
- ✅ Monthly reports available
- ✅ Biometric login enabled
- ✅ App live on App Store and Play Store

---

## Quality Gates

| Gate                      | Owner                 | Criteria                                 | Blocker    |
| ------------------------- | --------------------- | ---------------------------------------- | ---------- |
| Design System Complete    | UI/UX Designer        | All tokens migrated, 3 screens designed  | Week 1 End |
| Auth Integration Complete | Backend Integration   | Login/logout working, JWT refresh tested | Week 1 End |
| QR Scanner Working        | QR Scanner Specialist | 95%+ detection rate on 3 devices         | Week 2 End |
| Offline Support Ready     | State Management      | Queue + sync tested in offline mode      | Week 3 End |
| 80% Code Coverage         | Testing & QA          | All critical paths tested                | Week 3 End |
| CI/CD Pipeline Live       | DevOps & Deployment   | All tests automated in GitHub Actions    | Week 2 End |
| MVP on TestFlight/Play    | DevOps & Deployment   | External testers can download app        | Week 3 End |
| Production Launch         | Orchestrator          | App Store/Play Store approval            | Week 6 End |

---

## Risk Management

### High-Risk Items

1. **Apple Developer Account Approval Delay**
   - **Risk**: Approval can take 2-7 days
   - **Mitigation**: Apply for account in pre-development phase
   - **Contingency**: Focus on Android testing if iOS delayed

2. **QR Scanner Detection Rate Below 95%**
   - **Risk**: Native scanner might still have issues on specific devices
   - **Mitigation**: Test on 5+ physical devices early (Week 2 Day 1)
   - **Contingency**: Add manual entry fallback

3. **Supabase Quota Exceeded**
   - **Risk**: Free tier limits (500MB database, 2GB bandwidth)
   - **Mitigation**: Monitor usage in Supabase Dashboard
   - **Contingency**: Upgrade to Pro plan ($25/month)

4. **App Store Rejection**
   - **Risk**: Apple may reject for guideline violations
   - **Mitigation**: Review App Store Guidelines before submission
   - **Contingency**: Address feedback and resubmit (adds 1-3 days)

### Medium-Risk Items

1. **Firebase Configuration Issues**
   - **Risk**: FCM setup can be tricky (especially iOS)
   - **Mitigation**: Follow official Firebase Flutter setup guide
   - **Contingency**: Delay push notifications to Week 7 if needed

2. **Offline Sync Conflicts**
   - **Risk**: Server-wins strategy might discard user data
   - **Mitigation**: Show clear warnings when conflicts occur
   - **Contingency**: Implement conflict resolution UI

---

## Rollback Procedures

### If MVP Testing Fails (Week 3)

1. Identify critical bugs from tester feedback
2. Create hotfix branch from `develop`
3. Fix bugs, re-run full test suite
4. Rebuild and resubmit to TestFlight/Play Internal
5. Delay production launch by 1 week

### If Production Launch Has Critical Bug (Week 6)

1. Immediately pull app from App Store/Play Store (if possible)
2. Revert to last stable build (Week 5 build)
3. Submit expedited review to Apple (2-24 hours)
4. Communicate with users via in-app message

---

## Post-Launch Plan

### Week 7-8: Monitoring & Iteration

1. Monitor Sentry for crashes (fix P0 bugs within 24 hours)
2. Monitor Firebase Analytics for user engagement
3. Respond to user reviews (App Store, Google Play)
4. Collect feature requests from teachers
5. Plan next iteration (features, optimizations)

### Week 9-12: Enhancements

1. Add barcode scanning for student ID cards (if requested)
2. Add multi-language support (Spanish, French)
3. Add dark mode
4. Optimize app size (<30MB target)
5. Improve battery efficiency

---

## Appendix

### Useful Commands

```bash
# Create new Flutter project
flutter create gurukool_teacher

# Run on iOS simulator
flutter run -d ios

# Run on Android emulator
flutter run -d android

# Run tests
flutter test

# Run tests with coverage
flutter test --coverage

# Build Android APK (debug)
flutter build apk --debug

# Build Android App Bundle (release)
flutter build appbundle --release

# Build iOS IPA (release)
flutter build ios --release

# Generate JSON serialization code
flutter pub run build_runner build

# Clean build artifacts
flutter clean

# Check for outdated packages
flutter pub outdated
```

### Environment Variables

```bash
# Development build
flutter build apk \
  --dart-define=ENVIRONMENT=development \
  --dart-define=SUPABASE_URL=https://miqhtpbutevdrkyndflf.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key \
  --dart-define=API_BASE_URL=http://localhost:3000

# Production build
flutter build appbundle --release \
  --dart-define=ENVIRONMENT=production \
  --dart-define=SUPABASE_URL=https://miqhtpbutevdrkyndflf.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key \
  --dart-define=API_BASE_URL=https://gurukool-homeschool.vercel.app \
  --dart-define=SENTRY_DSN=your-sentry-dsn
```

### Key Dependencies

| Package              | Version | Purpose                     |
| -------------------- | ------- | --------------------------- |
| `flutter_riverpod`   | ^2.4.9  | State management            |
| `supabase_flutter`   | ^2.3.4  | Backend integration         |
| `mobile_scanner`     | ^3.5.5  | Native QR scanner           |
| `permission_handler` | ^11.1.0 | Camera/location permissions |
| `hive`               | ^2.2.3  | Offline storage             |
| `geolocator`         | ^10.1.0 | GPS tracking                |
| `firebase_messaging` | ^14.7.9 | Push notifications          |
| `google_fonts`       | ^6.1.0  | Typography (Inter font)     |
| `sentry_flutter`     | ^7.13.2 | Error tracking              |
| `connectivity_plus`  | ^5.0.2  | Network status              |

### Design Token Reference

| Tailwind CSS       | Flutter Dart                               |
| ------------------ | ------------------------------------------ |
| `bg-blue-600`      | `AppColors.primary` (0xFF2563EB)           |
| `text-gray-900`    | `AppColors.gray900` (0xFF111827)           |
| `p-4` (16px)       | `Spacing.md` (16.0)                        |
| `text-lg` (18px)   | `AppTypography.textTheme.bodyLarge` (16px) |
| `rounded-lg` (8px) | `BorderRadius.circular(8)`                 |

---

**Document Version**: 1.0
**Last Updated**: 2025-11-17
**Next Review**: After Week 3 MVP completion

**Related Documents**:

- [AI_AGENT_ARCHITECTURE.md](AI_AGENT_ARCHITECTURE.md) - Detailed agent prompts and code examples
- [ARCHITECTURE_REVIEW_REPORT.md](ARCHITECTURE_REVIEW_REPORT.md) - Original architecture analysis
- [CLAUDE.md](CLAUDE.md) - Project guidelines and conventions
