# GuruKool Image Usage Map

This document maps all images in the application to their usage locations, helping maintain consistency and making it easy to find or replace images.

## Directory Structure

```
public/images/
├── hero/                    # Landing page hero images
├── features/                # Feature section images
├── teacher/                 # Teacher dashboard images (planned)
├── parent/                  # Parent dashboard images (planned)
├── student/                 # Student-specific images (planned)
├── activities/              # Learning activity images (planned)
├── dashboard/               # Dashboard utility images (planned)
├── empty-states/            # Empty state illustrations (planned)
├── errors/                  # Error page illustrations (planned)
├── onboarding/              # Onboarding flow images (planned)
└── optimized/               # WebP optimized versions
    ├── hero/
    ├── features/
    └── ... (mirrors main structure)
```

## Current Images

### Hero Images (`/images/hero/`)

| Image                  | Optimized Path                                 | Used In            | Purpose                      |
| ---------------------- | ---------------------------------------------- | ------------------ | ---------------------------- |
| `mentor-student.jpg`   | `/images/optimized/hero/mentor-student.webp`   | `src/app/page.tsx` | Landing page hero background |
| `outdoor-learning.jpg` | `/images/optimized/hero/outdoor-learning.webp` | Available          | Alternative hero image       |

### Feature Images (`/images/features/`)

| Image                     | Optimized Path                                        | Used In            | Purpose                                      |
| ------------------------- | ----------------------------------------------------- | ------------------ | -------------------------------------------- |
| `mentorship.jpg`          | `/images/optimized/features/mentorship.webp`          | `src/app/page.tsx` | Large feature card - Personalized Mentorship |
| `tablet-learning.jpg`     | `/images/optimized/features/tablet-learning.webp`     | `src/app/page.tsx` | Medium feature card - Tech-Enabled Learning  |
| `collaborative-space.jpg` | `/images/optimized/features/collaborative-space.webp` | `src/app/page.tsx` | Medium feature card - Collaborative Learning |

## Planned Images (Not Yet Added)

### Teacher Dashboard (`/images/teacher/`)

| Planned Image         | Purpose                            | Usage Location                   |
| --------------------- | ---------------------------------- | -------------------------------- |
| `reviewing-work.webp` | Teacher reviewing student progress | Teacher dashboard welcome banner |
| `one-on-one.webp`     | One-on-one teaching session        | Teacher session card             |

### Parent Dashboard (`/images/parent/`)

| Planned Image           | Purpose                             | Usage Location             |
| ----------------------- | ----------------------------------- | -------------------------- |
| `helping-homework.webp` | Parent helping child with homework  | Parent dashboard welcome   |
| `father-teaching.webp`  | Father teaching son with laptop     | Teacher assignment section |
| `family-learning.webp`  | Family homeschool learning together | Student management section |

### Student Images (`/images/student/`)

| Planned Image           | Purpose                          | Usage Location           |
| ----------------------- | -------------------------------- | ------------------------ |
| `focused-studying.webp` | Student studying with headphones | Student dashboard hero   |
| `laptop-learning.webp`  | Child using laptop for learning  | Online learning sections |
| `with-backpack.webp`    | Student with backpack and books  | Student profiles         |

### Activity Images (`/images/activities/`)

| Planned Image        | Purpose                       | Usage Location     |
| -------------------- | ----------------------------- | ------------------ |
| `reading.webp`       | Student reading colorful book | Reading activities |
| `science.webp`       | Science experiments           | Science activities |
| `art-painting.webp`  | Creative art and painting     | Art activities     |
| `math-practice.webp` | Math problem solving          | Math activities    |

### Dashboard Utilities (`/images/dashboard/`)

| Planned Image            | Purpose                      | Usage Location    |
| ------------------------ | ---------------------------- | ----------------- |
| `qr-scanning.webp`       | QR code scanning on phone    | Check-in features |
| `progress-tracking.webp` | Progress analytics dashboard | Progress overview |

### Empty States (`/images/empty-states/`)

| Planned Image     | Purpose                        | Usage Location          |
| ----------------- | ------------------------------ | ----------------------- |
| `no-data.webp`    | Empty data state illustration  | Lists with no items     |
| `no-results.webp` | No search results illustration | Search results empty    |
| `welcome.webp`    | Welcome stickman illustration  | First-time user screens |

### Error Pages (`/images/errors/`)

| Planned Image  | Purpose                   | Usage Location          |
| -------------- | ------------------------- | ----------------------- |
| `404.webp`     | 404 error illustration    | `src/app/not-found.tsx` |
| `500.webp`     | Server error illustration | `src/app/error.tsx`     |
| `offline.webp` | Offline mode illustration | Network error states    |

### Onboarding (`/images/onboarding/`)

| Planned Image  | Purpose                | Usage Location      |
| -------------- | ---------------------- | ------------------- |
| `welcome.webp` | Welcome banner         | Onboarding step 1   |
| `setup.webp`   | Setup/configuration    | Onboarding step 2   |
| `success.webp` | Completion celebration | Onboarding complete |

## Usage Guidelines

### Image Optimization

All images should have an optimized WebP version in `/images/optimized/`:

```bash
# Run the optimization script
node scripts/optimize-images.js
```

### Using Images in Components

Always use Next.js Image component with optimized paths:

```tsx
import Image from 'next/image';

// For hero/background images
<Image
  src="/images/optimized/hero/mentor-student.webp"
  alt="Mentor and student learning together"
  fill
  className="object-cover"
  priority // Only for above-the-fold images
/>

// For feature cards
<Image
  src="/images/optimized/features/mentorship.webp"
  alt="One-on-one mentorship session"
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### Using EnhancedImageCard

For interactive image cards with visual effects:

```tsx
import { EnhancedImageCard } from '@/components/ui/EnhancedImageCard';

<EnhancedImageCard
  src="/images/optimized/features/mentorship.webp"
  alt="Personalized mentorship"
  title="Personalized Mentorship"
  description="Connect with experienced educators"
  gradient="from-teal-500 to-cyan-500"
  icon="👨‍🏫"
  size="large"
/>;
```

### Alt Text Guidelines

- Be descriptive but concise
- Include key subjects and actions
- Avoid "image of" or "picture of" prefixes
- Examples:
  - Good: "Mentor and student learning together outdoors"
  - Bad: "Image of people"

### Responsive Sizes

Use appropriate `sizes` prop for responsive images:

```tsx
// Full width on mobile, half on tablet, third on desktop
sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';

// Hero images (always full width)
sizes = '100vw';
```

## Brand Guidelines

### Image Selection Criteria

1. **Diversity**: Include diverse representation (age, ethnicity, gender)
2. **Modern Technology**: Show tablets, laptops, digital tools
3. **Natural Settings**: Prefer outdoor/natural light when possible
4. **Authentic Moments**: Candid learning moments over staged photos
5. **Energy**: Dynamic, engaging compositions

### Color Palette Integration

Images should complement the GuruKool color palette:

- Primary: Electric Teal (#008080)
- Secondary: Energetic Orange (#FF9F43)
- Backgrounds: Clean White / Soft Cream (#FDFBF7)

## Maintenance

### Adding New Images

1. Add original image to appropriate directory
2. Run `node scripts/optimize-images.js`
3. Update this document with new image details
4. Commit both original and optimized versions

### Replacing Images

1. Replace original file (keep same filename)
2. Re-run optimization script
3. Clear any CDN/browser cache if needed
4. Verify all usages display correctly

### Removing Images

1. Search codebase for image path
2. Remove/replace all usages
3. Delete both original and optimized versions
4. Update this document
