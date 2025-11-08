'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { cn, themeClasses } from '../../themes/theme-utils';
import { Card, CardHeader, CardTitle, CardContent } from '../base/Card';
import { animationPresets } from '../../animations/presets';

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface AnalyticsData {
  title: string;
  data: ChartDataPoint[];
  type: 'line' | 'area' | 'bar' | 'pie' | 'radial';
  color?: string;
  gradient?: boolean;
  interactive?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
}

interface AnalyticsDashboardProps {
  charts: AnalyticsData[];
  layout?: 'grid' | 'masonry' | 'single';
  interactive?: boolean;
  aiInsights?: {
    title: string;
    insights: string[];
    confidence: number;
  };
  onChartClick?: (chartData: AnalyticsData, dataPoint?: ChartDataPoint) => void;
  className?: string;
}

const chartColors = [
  '#0ea5e9', // blue
  '#d946ef', // purple
  '#10b981', // green
  '#f59e0b', // yellow
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'p-3 rounded-lg shadow-lg border',
          themeClasses.bg.surface,
          themeClasses.border.default,
          themeClasses.text.primary
        )}
      >
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </motion.div>
    );
  }
  return null;
};

const ChartContainer = ({
  chart,
  onChartClick,
  interactive = true,
}: {
  chart: AnalyticsData;
  onChartClick?: (chartData: AnalyticsData, dataPoint?: ChartDataPoint) => void;
  interactive?: boolean;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleDataPointClick = (data: any) => {
    if (interactive && onChartClick) {
      onChartClick(chart, data);
    }
  };

  const renderChart = () => {
    const commonProps = {
      data: chart.data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 },
    };

    switch (chart.type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {chart.showGrid && (
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            )}
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              className="text-xs"
            />
            <YAxis axisLine={false} tickLine={false} className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            {chart.showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey="value"
              stroke={chart.color || chartColors[0] || '#0ea5e9'}
              strokeWidth={3}
              dot={{
                fill: chart.color || chartColors[0] || '#0ea5e9',
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                r: 6,
                stroke: chart.color || chartColors[0] || '#0ea5e9',
                strokeWidth: 2,
              }}
              onClick={handleDataPointClick}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {chart.showGrid && (
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            )}
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              className="text-xs"
            />
            <YAxis axisLine={false} tickLine={false} className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            {chart.showLegend && <Legend />}
            <defs>
              <linearGradient
                id={`gradient-${chart.title}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={chart.color || chartColors[0] || '#0ea5e9'}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={chart.color || chartColors[0] || '#0ea5e9'}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={chart.color || chartColors[0] || '#0ea5e9'}
              fillOpacity={1}
              fill={
                chart.gradient
                  ? `url(#gradient-${chart.title})`
                  : chart.color || chartColors[0] || '#0ea5e9'
              }
              onClick={handleDataPointClick}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {chart.showGrid && (
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            )}
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              className="text-xs"
            />
            <YAxis axisLine={false} tickLine={false} className="text-xs" />
            <Tooltip content={<CustomTooltip />} />
            {chart.showLegend && <Legend />}
            <Bar
              dataKey="value"
              fill={chart.color || chartColors[0] || '#0ea5e9'}
              radius={[4, 4, 0, 0]}
              onClick={handleDataPointClick}
            />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chart.data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              onClick={handleDataPointClick}
            >
              {chart.data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length] || '#0ea5e9'}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {chart.showLegend && <Legend />}
          </PieChart>
        );

      case 'radial':
        return (
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="10%"
            outerRadius="80%"
            data={chart.data}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={chart.color || chartColors[0] || '#0ea5e9'}
              onClick={handleDataPointClick}
            />
            <Tooltip content={<CustomTooltip />} />
          </RadialBarChart>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={animationPresets.fadeInUp}
      {...(interactive ? { whileHover: { y: -2 } } : {})}
      className="h-full"
    >
      <Card variant="elevated" className="h-full">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{chart.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart() || <div />}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AIInsightsPanel = ({
  insights,
}: {
  insights: AnalyticsDashboardProps['aiInsights'];
}) => {
  if (!insights) {
    return null;
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={animationPresets.fadeInRight}
      className="col-span-full"
    >
      <Card variant="filled" className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span className="text-blue-500">🤖</span>
              {insights.title}
            </CardTitle>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Confidence:</span>
              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${insights.confidence}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <span className="text-xs font-medium">
                {insights.confidence}%
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20"
              >
                <span className="text-blue-500 mt-0.5">•</span>
                <span className="text-sm">{insight}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export function AnalyticsDashboard({
  charts,
  layout = 'grid',
  interactive = true,
  aiInsights,
  onChartClick,
  className,
}: AnalyticsDashboardProps) {
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  const layoutClasses = useMemo(() => {
    switch (layout) {
      case 'single':
        return 'grid grid-cols-1 gap-6';
      case 'masonry':
        return 'columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6';
      case 'grid':
      default:
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
    }
  }, [layout]);

  const handleChartClick = (
    chartData: AnalyticsData,
    dataPoint?: ChartDataPoint
  ) => {
    setSelectedChart(chartData.title);
    onChartClick?.(chartData, dataPoint);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* AI Insights */}
      <AIInsightsPanel insights={aiInsights} />

      {/* Charts Grid */}
      <motion.div
        className={layoutClasses}
        initial="container"
        animate="container"
        variants={{
          container: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        <AnimatePresence>
          {charts.map((chart, index) => (
            <motion.div
              key={chart.title}
              variants={{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -20 },
              }}
              className={cn(
                layout === 'masonry' && 'break-inside-avoid mb-6',
                selectedChart === chart.title &&
                  'ring-2 ring-blue-500 ring-opacity-50 rounded-xl'
              )}
            >
              <ChartContainer
                chart={chart}
                onChartClick={handleChartClick}
                interactive={interactive}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Sample data generator for testing
export const generateSampleData = (
  type: AnalyticsData['type'],
  count: number = 7
): ChartDataPoint[] => {
  const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return Array.from({ length: count }, (_, i) => ({
    name: names[i] || `Item ${i + 1}`,
    value: Math.floor(Math.random() * 100) + 10,
    category: `Category ${i + 1}`,
  }));
};
