import React from 'react';
import { Card, Text, Badge, Button } from '@mantine/core';
import { motion } from 'framer-motion';

interface InsightCardProps {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info' | 'error';
  actionLabel?: string;
  onAction?: () => void;
  data?: any;
}

export const InsightCard: React.FC<InsightCardProps> = ({
  title,
  description,
  type,
  actionLabel,
  onAction,
  data
}) => {
  const getTypeColor = () => {
    switch (type) {
      case 'success': return 'green';
      case 'warning': return 'yellow';
      case 'info': return 'blue';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <div className="flex items-start justify-between mb-4">
          <div>
            <Text size="lg" fw={500} mb={4}>
              {title}
            </Text>
            <Badge color={getTypeColor()} variant="light" mb={8}>
              {type.toUpperCase()}
            </Badge>
          </div>
        </div>
        
        <Text size="sm" color="dimmed" mb={16}>
          {description}
        </Text>

        {data && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <Text size="xs" fw={500} mb={2}>Data:</Text>
            <pre className="text-xs text-gray-600">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}

        {actionLabel && onAction && (
          <Button
            size="sm"
            color={getTypeColor()}
            onClick={onAction}
            fullWidth
          >
            {actionLabel}
          </Button>
        )}
      </Card>
    </motion.div>
  );
};

export default InsightCard;
