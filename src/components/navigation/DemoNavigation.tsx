'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '../../design-system';

export function DemoNavigation() {
  return (
    <motion.div
      className="fixed top-4 right-4 z-50"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link href="/design-system-demo">
        <Button variant="primary" size="sm">
          🎨 Design System Demo
        </Button>
      </Link>
    </motion.div>
  );
}