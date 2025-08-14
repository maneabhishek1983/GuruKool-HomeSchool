/**
 * Billing Dashboard Component
 * Visual analytics and reports for billing data
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  ResponsiveContainer
} from 'recharts';
import { billingDashboardService, BillingAnalytics, BillingPeriod } from '@/services/billing-dashboard.service';

interface BillingDashboardProps {
  teacherId: string;
  className?: string;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({
  teacherId,
  className = ''
}) => {
  const [analytics, setAnalytics] = useState<BillingAnalytics | null>(null);
  const [recentBilling, setRecentBilling] = useState<BillingPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'week', 'month', 'quarter', 'year'
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'payments' | 'reports'>('overview');

  // Color palette for charts
  const colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    warning: '#F97316',
    info: '#06B6D4'
  };

  const pieColors = [colors.primary, colors.secondary, colors.accent, colors.warning, colors.danger];

  useEffect(() => {
    loadDashboardData();
  }, [teacherId, selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);

      // Calculate period dates
      const periodDates = getPeriodDates(selectedPeriod);
      
      // Load analytics
      const analyticsData = await billingDashboardService.getBillingAnalytics(
        teacherId,
        periodDates
      );

      setAnalytics(analyticsData);

    } catch (error) {
      console.error('Failed to load billing dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPeriodDates = (period: string) => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    return { startDate, endDate: now };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const StatCard = ({ title, value, change, icon, color = 'primary' }: {
    title: string;
    value: string | number;
    change?: number;
    icon: React.ReactNode;
    color?: keyof typeof colors;
  }) => (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {typeof value === 'number' ? formatCurrency(value) : value}
          </p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100 text-${color}-600`}>
          {icon}
        </div>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-24" />
            ))}
          </div>
          <div className="mt-6 bg-gray-200 dark:bg-gray-700 rounded-lg h-96" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No billing data available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Start tracking sessions to see your billing analytics
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Billing Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your revenue, payments, and billing analytics
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex space-x-2">
          {['week', 'month', 'quarter', 'year'].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-3 py-1 text-sm rounded-md capitalize ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'revenue', label: 'Revenue' },
            { key: 'payments', label: 'Payments' },
            { key: 'reports', label: 'Reports' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue"
              value={analytics.totalRevenue}
              change={12.5}
              icon={<span className="text-xl">💰</span>}
              color="primary"
            />
            <StatCard
              title="Total Hours"
              value={`${analytics.totalHours.toFixed(1)}h`}
              change={8.2}
              icon={<span className="text-xl">⏱️</span>}
              color="secondary"
            />
            <StatCard
              title="Avg Hourly Rate"
              value={analytics.averageHourlyRate}
              change={-2.1}
              icon={<span className="text-xl">💵</span>}
              color="accent"
            />
            <StatCard
              title="Payment Rate"
              value={`${analytics.paymentRate.toFixed(1)}%`}
              change={5.3}
              icon={<span className="text-xl">✅</span>}
              color="secondary"
            />
          </div>

          {/* Revenue Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Revenue Status
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Paid</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(analytics.paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Pending</span>
                  <span className="font-semibold text-yellow-600">
                    {formatCurrency(analytics.pendingAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Overdue</span>
                  <span className="font-semibold text-red-600">
                    {formatCurrency(analytics.overdueAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analytics.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="amount"
                    nameKey="status"
                  >
                    {analytics.statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Revenue Trend Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis formatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke={colors.primary}
                  fill={colors.primary}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Hours vs Revenue */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Hours vs Revenue
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="hours"
                  fill={colors.secondary}
                  name="Hours"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="amount"
                  stroke={colors.primary}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Student */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Revenue by Student
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.revenueByStudent}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="studentName" />
                <YAxis formatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="amount" fill={colors.primary} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Payment Method Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Payment Methods
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analytics.paymentMethodBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="amount"
                    nameKey="method"
                  >
                    {analytics.paymentMethodBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-3">
                {analytics.paymentMethodBreakdown.map((method, index) => (
                  <div key={method.method} className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: pieColors[index % pieColors.length] }}
                      />
                      <span className="text-gray-700 dark:text-gray-300 capitalize">
                        {method.method.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(method.amount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {method.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Collected"
              value={analytics.paidAmount}
              icon={<span className="text-xl">💳</span>}
              color="secondary"
            />
            <StatCard
              title="Outstanding"
              value={analytics.pendingAmount + analytics.overdueAmount}
              icon={<span className="text-xl">⏳</span>}
              color="warning"
            />
            <StatCard
              title="Collection Rate"
              value={`${analytics.paymentRate.toFixed(1)}%`}
              icon={<span className="text-xl">📊</span>}
              color="primary"
            />
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Report Generation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Generate Reports
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { type: 'summary', title: 'Summary Report', icon: '📄' },
                { type: 'detailed', title: 'Detailed Report', icon: '📊' },
                { type: 'payment_history', title: 'Payment History', icon: '💳' },
                { type: 'tax_report', title: 'Tax Report', icon: '📋' },
                { type: 'student_breakdown', title: 'Student Breakdown', icon: '👥' }
              ].map((report) => (
                <button
                  key={report.type}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="text-2xl mb-2">{report.icon}</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {report.title}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Generate {report.title.toLowerCase()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Reports
            </h3>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">📋</div>
              <div>No reports generated yet</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingDashboard;