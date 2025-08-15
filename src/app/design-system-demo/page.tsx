'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Container,
  Text,
  Heading,
  Display,
  Grid,
  GridItem,
  Stack,
  VStack,
  HStack,
  Flex,
  LoadingSpinner,
  ProgressBar,
  CircularProgress,
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
} from '../../design-system';
import {
  ThemeProvider,
  ThemeToggle,
} from '../../design-system/themes/theme-provider';
import {
  animationPresets,
  staggerVariants,
} from '../../design-system/animations/presets';

function DemoContent() {
  const [progress, setProgress] = useState(65);
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <Container size="xl" className="py-8">
      {/* Header */}
      <motion.div
        className="text-center mb-12"
        variants={animationPresets.fadeInUp}
        initial="initial"
        animate="animate"
      >
        <Display className="mb-4 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          Design System Demo
        </Display>
        <Text size="lg" color="secondary" className="max-w-2xl mx-auto">
          Explore our premium UI components with smooth animations, dark mode
          support, and responsive design.
        </Text>
      </motion.div>

      {/* Components Grid */}
      <motion.div
        variants={staggerVariants.container}
        initial="initial"
        animate="animate"
        className="space-y-12"
      >
        {/* Buttons Section */}
        <motion.section variants={staggerVariants.item}>
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Buttons</CardTitle>
              <CardDescription>
                Interactive buttons with premium animations and multiple
                variants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VStack spacing="lg">
                <HStack spacing="md" wrap>
                  <Button variant="primary">Primary Button</Button>
                  <Button variant="secondary">Secondary Button</Button>
                  <Button variant="outline">Outline Button</Button>
                  <Button variant="ghost">Ghost Button</Button>
                  <Button variant="danger">Danger Button</Button>
                </HStack>

                <HStack spacing="md" wrap>
                  <Button size="xs">Extra Small</Button>
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button size="xl">Extra Large</Button>
                </HStack>

                <HStack spacing="md" wrap>
                  <Button
                    loading={loading}
                    onClick={handleLoadingDemo}
                    leftIcon={!loading ? <span>🚀</span> : undefined}
                  >
                    {loading ? 'Loading...' : 'Start Demo'}
                  </Button>
                  <Button variant="outline" rightIcon={<span>→</span>}>
                    With Icon
                  </Button>
                  <Button fullWidth variant="secondary">
                    Full Width Button
                  </Button>
                </HStack>
              </VStack>
            </CardContent>
          </Card>
        </motion.section>

        {/* Typography Section */}
        <motion.section variants={staggerVariants.item}>
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>
                Premium typography system with semantic components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VStack spacing="lg">
                <div>
                  <Display size="2xl">Display Text</Display>
                  <Text color="secondary">
                    Large, bold text for hero sections
                  </Text>
                </div>

                <div>
                  <Heading level={1}>Heading Level 1</Heading>
                  <Heading level={2}>Heading Level 2</Heading>
                  <Heading level={3}>Heading Level 3</Heading>
                </div>

                <div>
                  <Text size="lg">Large body text for important content</Text>
                  <Text>Regular body text for general content</Text>
                  <Text size="sm" color="secondary">
                    Small text for captions and metadata
                  </Text>
                </div>

                <HStack spacing="lg" wrap>
                  <Text color="success">Success Text</Text>
                  <Text color="warning">Warning Text</Text>
                  <Text color="error">Error Text</Text>
                  <Text color="muted">Muted Text</Text>
                </HStack>
              </VStack>
            </CardContent>
          </Card>
        </motion.section>

        {/* Layout Components */}
        <motion.section variants={staggerVariants.item}>
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Layout Components</CardTitle>
              <CardDescription>
                Flexible layout system with Grid, Stack, and Flex components
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VStack spacing="lg">
                <div>
                  <Text weight="medium" className="mb-4">
                    Responsive Grid
                  </Text>
                  <Grid cols={1} responsive={{ sm: 2, lg: 4 }} gap="md">
                    {[1, 2, 3, 4].map(i => (
                      <GridItem key={i}>
                        <Card
                          variant="filled"
                          padding="md"
                          className="text-center"
                        >
                          <Text>Grid Item {i}</Text>
                        </Card>
                      </GridItem>
                    ))}
                  </Grid>
                </div>

                <div>
                  <Text weight="medium" className="mb-4">
                    Stack Layout
                  </Text>
                  <HStack
                    spacing="md"
                    justify="between"
                    className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <Card variant="elevated" padding="sm">
                      <Text size="sm">Item 1</Text>
                    </Card>
                    <Card variant="elevated" padding="sm">
                      <Text size="sm">Item 2</Text>
                    </Card>
                    <Card variant="elevated" padding="sm">
                      <Text size="sm">Item 3</Text>
                    </Card>
                  </HStack>
                </div>
              </VStack>
            </CardContent>
          </Card>
        </motion.section>

        {/* Progress & Loading */}
        <motion.section variants={staggerVariants.item}>
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Progress & Loading</CardTitle>
              <CardDescription>
                Beautiful loading states and progress indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VStack spacing="lg">
                <div>
                  <Text weight="medium" className="mb-4">
                    Progress Bars
                  </Text>
                  <VStack spacing="md">
                    <ProgressBar
                      value={progress}
                      showLabel
                      label="Upload Progress"
                    />
                    <ProgressBar value={85} color="success" size="sm" />
                    <ProgressBar value={45} color="warning" size="lg" />
                    <HStack spacing="md" justify="center">
                      <Button
                        size="sm"
                        onClick={() => setProgress(Math.max(0, progress - 10))}
                      >
                        Decrease
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          setProgress(Math.min(100, progress + 10))
                        }
                      >
                        Increase
                      </Button>
                    </HStack>
                  </VStack>
                </div>

                <div>
                  <Text weight="medium" className="mb-4">
                    Circular Progress
                  </Text>
                  <HStack spacing="lg" justify="center">
                    <CircularProgress value={progress} showLabel />
                    <CircularProgress value={75} color="success" size={48} />
                    <CircularProgress value={30} color="warning" size={32} />
                  </HStack>
                </div>

                <div>
                  <Text weight="medium" className="mb-4">
                    Loading Spinners
                  </Text>
                  <HStack spacing="lg" justify="center" align="center">
                    <LoadingSpinner variant="spin" />
                    <LoadingSpinner variant="pulse" color="secondary" />
                    <LoadingSpinner variant="bounce" color="success" />
                    <LoadingSpinner variant="dots" size="lg" />
                  </HStack>
                </div>
              </VStack>
            </CardContent>
          </Card>
        </motion.section>

        {/* Skeleton Loading */}
        <motion.section variants={staggerVariants.item}>
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Skeleton Loading</CardTitle>
              <CardDescription>
                Elegant loading placeholders for better UX
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Grid cols={1} responsive={{ md: 2 }} gap="lg">
                <div>
                  <Text weight="medium" className="mb-4">
                    Basic Skeletons
                  </Text>
                  <VStack spacing="md">
                    <HStack spacing="md" align="center">
                      <SkeletonAvatar size={48} />
                      <VStack spacing="sm" className="flex-1">
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="40%" />
                      </VStack>
                    </HStack>
                    <SkeletonText lines={3} />
                    <Skeleton
                      variant="rectangular"
                      height={120}
                      className="rounded-lg"
                    />
                  </VStack>
                </div>

                <div>
                  <Text weight="medium" className="mb-4">
                    Card Skeleton
                  </Text>
                  <Card variant="outlined" padding="none">
                    <SkeletonCard />
                  </Card>
                </div>
              </Grid>
            </CardContent>
          </Card>
        </motion.section>

        {/* Interactive Cards */}
        <motion.section variants={staggerVariants.item}>
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Interactive Cards</CardTitle>
              <CardDescription>
                Hover and tap animations with premium effects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Grid cols={1} responsive={{ sm: 2, lg: 3 }} gap="lg">
                {[
                  {
                    title: 'Analytics Dashboard',
                    desc: 'View your performance metrics',
                    icon: '📊',
                  },
                  {
                    title: 'User Management',
                    desc: 'Manage users and permissions',
                    icon: '👥',
                  },
                  {
                    title: 'Settings',
                    desc: 'Configure your preferences',
                    icon: '⚙️',
                  },
                ].map((item, index) => (
                  <Card key={index} interactive variant="elevated" padding="lg">
                    <VStack spacing="md">
                      <div className="text-3xl">{item.icon}</div>
                      <div className="text-center">
                        <Text weight="semibold" size="lg">
                          {item.title}
                        </Text>
                        <Text color="secondary" size="sm">
                          {item.desc}
                        </Text>
                      </div>
                      <Button variant="outline" size="sm" fullWidth>
                        Learn More
                      </Button>
                    </VStack>
                  </Card>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </motion.section>

        {/* Animation Showcase */}
        <motion.section variants={staggerVariants.item}>
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Animation Showcase</CardTitle>
              <CardDescription>
                Smooth animations and micro-interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Grid cols={1} responsive={{ sm: 2, lg: 4 }} gap="md">
                {[
                  { name: 'Fade In', preset: animationPresets.fadeIn },
                  { name: 'Slide Up', preset: animationPresets.fadeInUp },
                  { name: 'Scale In', preset: animationPresets.scaleIn },
                  { name: 'Bounce', preset: animationPresets.scaleInBounce },
                ].map((animation, index) => (
                  <motion.div
                    key={index}
                    className="p-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-lg text-center"
                    {...animation.preset}
                    transition={{
                      ...animation.preset.transition,
                      delay: index * 0.1,
                    }}
                  >
                    <Text weight="medium" size="sm">
                      {animation.name}
                    </Text>
                  </motion.div>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </motion.section>
      </motion.div>
    </Container>
  );
}

export default function DesignSystemDemo() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
        <DemoContent />
      </div>
    </ThemeProvider>
  );
}
