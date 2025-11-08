# GuruKool HomeSchool

An AI-enhanced homeschooling management platform that streamlines the entire homeschooling experience. Parents can manage students, hire teachers, track sessions, and leverage AI-powered insights. Teachers use QR code authentication for seamless check-in/check-out, while students access their personalized learning materials.

## 🌟 Features

### For Parents

- **Student Profile Management**: Create comprehensive student profiles with country-specific academic standards (UK, US, India)
- **Teacher Management**: Hire, manage, and assign teachers to specific students
- **QR Code System**: Generate student-specific QR codes for teacher authentication
- **Timesheet Tracking**: Monitor teacher sessions, hours, and billing
- **AI-Powered Insights**: Get intelligent recommendations and progress analytics
- **Data Sheets**: Track academic progress and learning outcomes
- **Multi-Student Support**: Manage multiple children in one dashboard

### For Teachers

- **QR Authentication**: Quick check-in/check-out using student QR codes
- **Session Management**: Track teaching sessions with location verification
- **Timesheet Automation**: Automatic hour calculation and session logging
- **Student Progress**: View assigned students and their learning plans
- **Notes & Feedback**: Add session notes and student feedback
- **Monthly Reports**: Generate timesheet summaries for billing

### For Administrators

- **User Management**: Create and manage all user accounts
- **System Analytics**: Monitor platform usage and performance
- **Demo Credentials**: Generate test accounts (dev/staging only)
- **Platform Configuration**: System-wide settings and security

### For Students

- **Learning Dashboard**: Access assignments and learning materials
- **Progress Tracking**: View personal academic progress
- **Teacher Feedback**: See feedback from teachers

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Getting Started](#getting-started)
- [User Guides](#user-guides)
  - [Parent Guide](#parent-guide)
  - [Teacher Guide](#teacher-guide)
  - [Admin Guide](#admin-guide)
- [Features Deep Dive](#features-deep-dive)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

## 🔧 Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **Supabase Account** (for database and authentication)
- **OpenAI API Key** (for AI features, development only)
- **Git** for version control

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/maneabhishek1983/GuruKool-HomeSchool.git
cd GuruKool-HomeSchool
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# AI Configuration (Development Only)
OPENAI_API_KEY=your-openai-api-key
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment

# Demo Credentials (Development/Staging Only)
DEMO_PARENT_PASSWORD=parent123
DEMO_ADMIN_PASSWORD=admin123
DEMO_TEACHER_PASSWORD=teacher123
ENABLE_DEMO_CREDENTIALS=false
```

See [HOW_TO_GET_CREDENTIALS.md](./HOW_TO_GET_CREDENTIALS.md) for detailed instructions on obtaining these credentials.

### 4. Set Up Database

Apply database migrations in Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run migrations from `supabase/migrations/` in order:
   - `001_initial_schema.sql`
   - `002_data_sheets.sql`
   - `003_timesheet.sql`
   - `004_teachers.sql`
   - `005_teacher_qr_codes.sql`
   - `006_rls_policies.sql`

See [QUICK_START_MIGRATIONS.md](./QUICK_START_MIGRATIONS.md) for step-by-step instructions.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## ⚙️ Configuration

### Vercel Deployment

For production deployment to Vercel, see [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md).

### Environment-Specific Settings

- **Development**: Uses OpenAI API for AI features, demo credentials enabled
- **Production**: Uses Chomsky LLM, OKTA, APIM; demo credentials disabled

## 🚀 Getting Started

### First-Time Setup

#### Option 1: Use Demo Accounts (Development/Staging)

For quick testing, use pre-configured demo accounts:

**Parent Account:**

- Email: `parent@example.com`
- Password: `parent123`

**Teacher Account:**

- Email: `teacher@example.com`
- Password: `teacher123`

**Admin Account:**

- Email: `admin@example.com`
- Password: `admin123`

⚠️ **Note:** Demo accounts are automatically disabled in production.

#### Option 2: Create Your Own Account

1. Navigate to [http://localhost:3000/login](http://localhost:3000/login)
2. Click **"Don't have an account? Sign up"**
3. Fill in:
   - Full Name
   - Email Address
   - Password (minimum 6 characters)
   - Account Type (Parent/Teacher/Admin)
4. Click **"Create Account"**
5. You'll be redirected to your dashboard

## 📖 User Guides

### Parent Guide

#### 1. Create Your First Student Profile

**Step 1:** Log in to your parent account

- Navigate to [http://localhost:3000/login](http://localhost:3000/login)
- Enter your email and password
- Click **"Sign In"**

**Step 2:** Access the Parent Dashboard

- After login, you'll be redirected to `/parent/dashboard`
- You'll see the Netflix-inspired dark theme (black background, red accents)

**Step 3:** Create a Student Profile

- Click **"Create Student Profile"** button
- Fill in the student information:

  **Basic Information:**
  - Student Name (e.g., "Emma Johnson")
  - Age (e.g., "10")
  - Date of Birth
  - Grade/Year (e.g., "Year 5")

  **Academic Standards:**
  - Select Country: UK, US, or India
  - This determines the curriculum standards:
    - **UK**: Year-based (Foundation to Year 13)
    - **US**: Grade-based (Pre-K to Grade 12)
    - **India**: Class-based (Nursery to Class 12)

  **Subjects:**
  - Select subjects appropriate for the country:
    - **UK**: English, Maths, Science, History, Geography, etc.
    - **US**: Language Arts, Mathematics, Science, Social Studies, etc.
    - **India**: Hindi, English, Mathematics, Science, Social Studies, etc.

  **Learning Goals:**
  - Add specific learning objectives
  - Example: "Master multiplication tables up to 12x12"

  **Additional Information (Optional):**
  - Learning preferences
  - Special needs or accommodations
  - Interests and hobbies

- Click **"Save Student Profile"**

**Step 4:** View Student Profile

- The new student appears in your students list
- Click on the student card to view full profile
- Access progress tracking, AI insights, and learning analytics

#### 2. Hire and Manage Teachers

**Step 1:** Create a Teacher Profile

- From the parent dashboard, click **"Create Teacher Profile"**
- Fill in teacher information:

  **Personal Information:**
  - Full Name (e.g., "John Smith")
  - Email Address (e.g., "john.smith@example.com")
  - Phone Number (optional)

  **Professional Details:**
  - Qualifications (e.g., "B.Ed., M.A. in English")
  - Subjects (e.g., "English, Literature, Creative Writing")
  - Experience (years)
  - Specializations

  **Rate Information:**
  - Hourly Rate (e.g., "£30/hour")
  - Currency (GBP, USD, INR)
  - Billing Frequency (weekly, bi-weekly, monthly)

- Click **"Create Teacher"**

**Step 2:** Assign Teacher to Student

- Click **"Assign Teachers"** button
- Select the student from dropdown
- Select the teacher to assign
- Choose subjects the teacher will teach
- Set schedule (days, times)
- Click **"Assign Teacher"**

**Step 3:** QR Code Generation (Automatic)

- Once assigned, a student-specific QR code is automatically generated
- This QR code contains:
  - Teacher ID
  - Student ID
  - Parent ID
  - Encrypted signature
  - Timestamp

**Step 4:** Share QR Code with Teacher

- Click **"View QR Codes"** from dashboard
- Filter by student or teacher
- Print or share QR code:
  - **Print**: Click "Print QR Code" for physical copy
  - **Digital**: Send via email or messaging app
- Teacher uses this QR code to check-in/out for sessions

#### 3. Track Teacher Sessions & Timesheets

**Step 1:** View Active Sessions

- Dashboard shows real-time active sessions
- See which teachers are currently checked in
- View session duration and location

**Step 2:** View Timesheet History

- Click **"Timesheets"** tab
- Filter by:
  - Teacher
  - Student
  - Date range
  - Subject

**Step 3:** Review Session Details

- Click on any session to view:
  - Check-in time and location
  - Check-out time
  - Total hours
  - Teacher notes
  - Session subject

**Step 4:** Generate Reports

- Click **"Generate Report"**
- Select report type:
  - Daily summary
  - Weekly summary
  - Monthly summary (for billing)
- Filter by teacher or student
- Export as PDF or CSV

**Step 5:** Billing & Payments

- View total hours per teacher
- Calculate billing: Hours × Hourly Rate
- Export billing reports for accounting

#### 4. View AI Insights & Analytics

**Step 1:** Access Student Analytics

- Click on student card
- Navigate to **"Analytics"** tab

**Step 2:** View AI Insights

- **Learning Patterns**: AI-detected strengths and weaknesses
- **Progress Predictions**: Projected learning trajectory
- **Recommendations**: Personalized study suggestions
- **Subject Analysis**: Performance breakdown by subject

**Step 3:** Track Progress Over Time

- View progress graphs and charts
- Compare performance across subjects
- Monitor improvement trends
- Identify areas needing attention

### Teacher Guide

#### 1. Access Your Teacher Dashboard

**Step 1:** Log In

- Navigate to [http://localhost:3000/login](http://localhost:3000/login)
- Enter teacher email and password
- Click **"Sign In"**
- You'll see the Amazon-inspired theme (white background, orange accents)

**Step 2:** Dashboard Overview

- View assigned students
- See upcoming sessions
- Check timesheet summary

#### 2. Check-In for a Teaching Session

**Step 1:** Navigate to Sessions

- Click **"Sessions"** or **"Check In/Out"** from dashboard

**Step 2:** Scan Student QR Code

- Click **"Scan QR Code to Check In"**
- Allow camera access when prompted
- Position the student's QR code in front of camera
- QR code contains student-specific authentication data

**Step 3:** Verify Location (Automatic)

- Browser requests location permission
- Location is automatically captured on check-in
- This verifies you're at the teaching location

**Step 4:** Check-In Confirmation

- Success message displays: "Successfully checked in!"
- Active session card appears showing:
  - Student name
  - Subject
  - Check-in time
  - Current session duration (live counter)

**Step 5:** Session is Now Active

- Parent can see you're currently teaching
- Timer runs automatically
- Location is recorded

#### 3. Check-Out from a Teaching Session

**Step 1:** End Your Session

- Click **"Check Out"** button on active session card

**Step 2:** Add Session Notes (Optional)

- Modal appears for checkout
- Add notes about the session:
  - Topics covered
  - Student progress
  - Homework assigned
  - Any concerns or highlights

**Step 3:** Confirm Check-Out

- Click **"Confirm Check Out"**
- Session ends automatically

**Step 4:** View Session Summary

- Success message shows total session time
- Example: "Successfully checked out! Total time: 1.5 hours"
- Session is added to timesheet

#### 4. Manage Your Timesheet

**Step 1:** View Timesheet

- Click **"Timesheet"** tab
- See all completed sessions

**Step 2:** Filter & Search

- Filter by:
  - Student
  - Date range
  - Subject

**Step 3:** Generate Monthly Report

- Click **"Generate Monthly Report"**
- Select month
- View total hours
- Export for billing purposes

#### 5. View Assigned Students

**Step 1:** Access Student List

- Click **"My Students"** from dashboard
- See all students assigned to you

**Step 2:** View Student Details

- Click on student card
- View:
  - Student profile
  - Learning goals
  - Academic standards
  - Progress data (if shared by parent)

**Step 3:** Add Student Notes

- Record observations about student progress
- Add teaching notes
- Track student strengths and areas for improvement

### Admin Guide

#### 1. Access Admin Dashboard

**Step 1:** Log In as Admin

- Navigate to [http://localhost:3000/login](http://localhost:3000/login)
- Enter admin credentials
- Click **"Sign In"**
- Redirected to `/admin/dashboard`

**Step 2:** Dashboard Overview

- View total users count
- Monitor system activity
- Access user management tools

#### 2. Create User Accounts

**Step 1:** Create New User

- Click **"Create New User"** button
- Fill in user details:
  - Full Name
  - Email Address
  - Account Type (Parent/Teacher/Student/Admin)

**Step 2:** Generate Credentials

- Password is auto-generated (secure 12-character password)
- QR code is generated for user
- Credentials are displayed on screen

**Step 3:** Share Credentials

- Copy credentials to clipboard
- Print QR code
- Email credentials to user
- User can login with provided credentials

#### 3. Manage Existing Users

**Step 1:** View All Users

- Dashboard shows list of all users
- Filter by role (Parent/Teacher/Student/Admin)

**Step 2:** User Actions

- View user details
- Deactivate/activate accounts
- Reset passwords
- View user activity

#### 4. Monitor System Analytics

**Step 1:** Access Analytics

- Click **"Analytics"** tab
- View system-wide metrics

**Step 2:** Monitor Key Metrics

- Total users
- Active sessions
- Total students
- Total teachers
- Session hours logged
- Platform usage trends

#### 5. Demo Credentials (Dev/Staging Only)

**Step 1:** Access Demo Credentials

- Navigate to `/api/credentials`
- Only works in development/staging

**Step 2:** Retrieve Credentials

- POST request to `/api/credentials` with email
- Returns password for demo accounts
- ⚠️ Automatically disabled in production

## 🎯 Features Deep Dive

### QR Code Authentication System

#### How It Works

1. **QR Code Generation**:
   - Parent assigns teacher to student
   - System generates unique QR code containing:
     ```json
     {
       "type": "teacher_auth",
       "teacherId": "uuid",
       "studentId": "uuid",
       "parentId": "uuid",
       "timestamp": 1234567890,
       "signature": "encrypted-hash"
     }
     ```

2. **QR Code Security**:
   - Contains encrypted signature for validation
   - Signature verifies authenticity
   - Prevents QR code tampering
   - Student-specific (can't be used for other students)

3. **Check-In Process**:
   - Teacher scans QR code
   - System validates signature
   - Checks if QR code is active
   - Captures location
   - Creates session record in database

4. **Session Tracking**:
   - Session ID is generated
   - Check-in time recorded
   - Location stored
   - Updates QR code usage count

5. **Check-Out Process**:
   - Teacher adds optional notes
   - Check-out time recorded
   - Duration calculated automatically
   - Session marked as complete

### Academic Standards System

#### Country-Specific Standards

**UK System**:

- Year-based curriculum (Foundation to Year 13)
- Subjects: English, Maths, Science, History, Geography, Computing, PE, Art, Music, etc.
- National Curriculum standards
- Key Stages (KS1, KS2, KS3, KS4, KS5)

**US System**:

- Grade-based curriculum (Pre-K to Grade 12)
- Subjects: Language Arts, Mathematics, Science, Social Studies, PE, Arts, Technology, etc.
- Common Core State Standards
- Grade levels (Elementary, Middle School, High School)

**India System**:

- Class-based curriculum (Nursery to Class 12)
- Subjects: Hindi, English, Mathematics, Science, Social Studies, Computer Science, etc.
- CBSE/ICSE/State Board standards
- Stages (Primary, Upper Primary, Secondary, Senior Secondary)

### AI-Powered Insights

#### Learning Analytics

- Progress tracking across subjects
- Strength and weakness identification
- Learning pattern recognition
- Personalized recommendations

#### Predictive Analytics

- Performance predictions
- Intervention suggestions
- Goal achievement forecasting

### Offline Support

#### Session Storage

- Sessions saved locally when offline
- Automatic sync when connection restored
- No data loss during connectivity issues

#### Offline Check-In/Out

- Teachers can check-in/out without internet
- Data queued for sync
- Syncs automatically when online

## 📚 API Documentation

Complete API reference available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Key Endpoints

**Authentication:**

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout

**Students:**

- `GET /api/students` - List students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student details
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

**Teachers:**

- `GET /api/teachers` - List teachers
- `POST /api/teachers` - Create teacher
- `PUT /api/teachers/:id` - Update teacher
- `POST /api/teachers/:id/rates` - Update teacher rates

**Sessions:**

- `GET /api/sessions` - List sessions
- `POST /api/sessions` - Create session (check-in)
- `PUT /api/sessions/:id` - Update session (check-out)

## 🛠️ Development

### Project Structure

```
gurukool-homeschool/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── parent/            # Parent dashboard & pages
│   │   ├── teacher/           # Teacher dashboard & pages
│   │   ├── admin/             # Admin dashboard & pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── parent/           # Parent-specific components
│   │   ├── teacher/          # Teacher-specific components
│   │   └── auth/             # Authentication components
│   ├── services/             # Business logic services
│   │   ├── database.service.ts
│   │   ├── teacher-qr.service.ts
│   │   ├── session.service.ts
│   │   └── timesheet.service.ts
│   ├── lib/                  # Core utilities
│   │   ├── supabase.ts       # Supabase client
│   │   ├── validation.ts     # Zod schemas
│   │   └── api-security.ts   # Rate limiting & CSRF
│   ├── types/                # TypeScript types
│   └── design-system/        # UI design system
├── supabase/
│   └── migrations/           # Database migrations
├── scripts/                  # Utility scripts
└── public/                   # Static assets
```

### Available Scripts

**Development:**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

**Code Quality:**

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - TypeScript type checking
- `npm run format` - Format with Prettier

**Testing:**

- `npm test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run test:coverage` - Generate coverage report
- `npm run test:comprehensive` - Run all tests

**Database:**

- `npm run verify:supabase` - Verify Supabase connection
- `npm run verify:rls` - Verify RLS policies
- `npm run db:push` - Push migrations to Supabase

### Adding New Features

1. Create feature branch: `git checkout -b feature/feature-name`
2. Implement feature following existing patterns
3. Add tests for new functionality
4. Update documentation
5. Create pull request

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
npm test

# Run specific test file
npm test -- session.store.test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug
```

### Test Coverage

Current coverage (see [QA_TEST_REPORT.md](./QA_TEST_REPORT.md)):

- Unit Tests: Services, stores, utilities
- E2E Tests: Auth flows, user journeys
- Integration Tests: API routes

## 🚀 Deployment

### Vercel Deployment (Recommended)

**Step 1:** Install Vercel CLI

```bash
npm install -g vercel
```

**Step 2:** Login to Vercel

```bash
vercel login
```

**Step 3:** Deploy

```bash
vercel --prod
```

**Step 4:** Configure Environment Variables

- Go to Vercel Dashboard
- Navigate to Project Settings → Environment Variables
- Add all required environment variables
- See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)

### Manual Deployment

**Step 1:** Build the project

```bash
npm run build
```

**Step 2:** Start production server

```bash
npm run start
```

**Step 3:** Configure reverse proxy (Nginx/Apache)

**Step 4:** Set up SSL certificate (Let's Encrypt)

### Docker Deployment

```bash
# Build Docker image
docker build -t gurukool-homeschool .

# Run container
docker run -p 3000:3000 gurukool-homeschool
```

## 🐛 Troubleshooting

### Common Issues

#### Issue: "Cannot connect to Supabase"

**Solution:**

1. Check `.env.local` has correct Supabase credentials
2. Verify Supabase project is active
3. Check internet connection
4. Run: `npm run verify:supabase`

#### Issue: "Demo credentials not working"

**Solution:**

1. Ensure `ENABLE_DEMO_CREDENTIALS=true` in `.env.local`
2. Check `NODE_ENV` is not set to `production`
3. Verify demo accounts exist in Supabase

#### Issue: "QR code scanning not working"

**Solution:**

1. Allow camera permissions in browser
2. Ensure HTTPS (camera requires secure context)
3. Check QR code is student-specific for the teacher
4. Verify QR code hasn't expired

#### Issue: "Theme not displaying correctly"

**Solution:**

1. Clear browser cache
2. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
3. Check if role-based theme is enabled
4. Verify no hardcoded theme classes in layout

#### Issue: "Database migrations failing"

**Solution:**

1. Run migrations in order (001, 002, 003, etc.)
2. Check for existing tables/conflicts
3. Review migration SQL for errors
4. See [QUICK_START_MIGRATIONS.md](./QUICK_START_MIGRATIONS.md)

### Getting Help

- **Documentation**: Check [CLAUDE.md](./CLAUDE.md) for detailed architecture
- **Issues**: [GitHub Issues](https://github.com/maneabhishek1983/GuruKool-HomeSchool/issues)
- **API Docs**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## ❓ FAQ

### General Questions

**Q: Is this app free to use?**
A: Yes, the codebase is open source (MIT License). However, you'll need your own Supabase account and API keys.

**Q: Can I use this for multiple families?**
A: Yes, the platform supports multiple parent accounts, each with their own students and teachers.

**Q: Does this work offline?**
A: Partially. Teachers can check-in/out offline, and data syncs when back online. However, creating profiles requires internet.

### Parent Questions

**Q: How many students can I add?**
A: No limit. You can add as many students as you need.

**Q: Can one teacher teach multiple students?**
A: Yes, assign the same teacher to multiple students. Each student gets a unique QR code.

**Q: How is teacher billing calculated?**
A: Total session hours × hourly rate. Export monthly reports for exact billing.

**Q: Can I see live sessions?**
A: Yes, the parent dashboard shows all active sessions in real-time.

### Teacher Questions

**Q: What if I forget to check out?**
A: Contact the parent to manually close the session, or use the fallback checkout feature.

**Q: Can I edit my timesheet?**
A: No, timesheets are immutable for accuracy. Contact the parent for corrections.

**Q: What if the QR code doesn't scan?**
A: Ensure good lighting, steady camera, and QR code is not damaged. Use fallback authentication if needed.

### Technical Questions

**Q: What database does this use?**
A: Supabase (PostgreSQL) with Row Level Security for data isolation.

**Q: Is the data secure?**
A: Yes. RLS policies ensure parents only see their data. Passwords are hashed. QR codes are signed and encrypted.

**Q: Can I self-host this?**
A: Yes, you can deploy to any Node.js hosting platform. Vercel is recommended for ease of use.

**Q: Does this support mobile devices?**
A: Yes, the UI is responsive and works on mobile browsers. No native app yet.

## 📄 License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support, please:

- Open an issue on GitHub
- Check the documentation files
- Review the troubleshooting section

## 🙏 Acknowledgments

- Built with Next.js 14, React 18, TypeScript
- UI powered by Tailwind CSS and Framer Motion
- Database and Auth by Supabase
- AI features by OpenAI
- QR code generation by qrcode library

---

**Made with ❤️ for homeschooling families**
