'use client';

import EnhancedImageCard from '@/components/ui/EnhancedImageCard';

export type StudentHeroType = 'focused-studying' | 'laptop-learning' | 'with-backpack';

interface StudentHeroProps {
  type?: StudentHeroType;
  studentName?: string;
  title?: string;
  description?: string;
  className?: string;
}

const studentHeroConfig: Record<StudentHeroType, {
  image: string;
  defaultTitle: string;
  defaultDescription: string;
  gradient: string;
  icon: string;
}> = {
  'focused-studying': {
    image: '/images/student/focused-studying.webp',
    defaultTitle: 'Focus Mode Active',
    defaultDescription: 'Stay concentrated and achieve your learning goals',
    gradient: 'from-blue-500 to-cyan-500',
    icon: '🎧',
  },
  'laptop-learning': {
    image: '/images/optimized/student/laptop-learning.webp',
    defaultTitle: 'Digital Learning',
    defaultDescription: 'Explore online courses and interactive lessons',
    gradient: 'from-purple-500 to-pink-500',
    icon: '💻',
  },
  'with-backpack': {
    image: '/images/optimized/student/with-backpack.webp',
    defaultTitle: 'Ready to Learn',
    defaultDescription: 'Your educational journey starts here',
    gradient: 'from-amber-500 to-orange-500',
    icon: '🎒',
  },
};

export default function StudentHero({
  type = 'focused-studying',
  studentName,
  title,
  description,
  className = '',
}: StudentHeroProps) {
  const config = studentHeroConfig[type];
  
  const displayTitle = title || (studentName ? `Welcome Back, ${studentName}!` : config.defaultTitle);
  const displayDescription = description || config.defaultDescription;

  return (
    <div className={`w-full ${className}`}>
      <EnhancedImageCard
        src={config.image}
        alt={displayTitle}
        title={displayTitle}
        description={displayDescription}
        gradient={config.gradient}
        icon={config.icon}
        size="large"
        className="w-full"
      />
    </div>
  );
}
