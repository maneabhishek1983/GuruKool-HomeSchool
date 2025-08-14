import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalyticsDashboard, generateSampleData } from '../AnalyticsDashboard';
import type { AnalyticsData, ChartDataPoint } from '../AnalyticsDashboard';

// Mock Recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  RadialBarChart: ({ children }: any) => <div data-testid="radial-chart">{children}</div>,
  RadialBar: () => <div data-testid="radial-bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  Cell: () => <div data-testid="cell" />,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('AnalyticsDashboard', () => {
  const sampleData: ChartDataPoint[] = [
    { name: 'Jan', value: 30 },
    { name: 'Feb', value: 45 },
    { name: 'Mar', value: 60 },
  ];

  const sampleCharts: AnalyticsData[] = [
    {
      title: 'Line Chart',
      data: sampleData,
      type: 'line',
      color: '#0ea5e9',
      showGrid: true,
      showLegend: true,
    },
    {
      title: 'Bar Chart',
      data: sampleData,
      type: 'bar',
      color: '#10b981',
    },
    {
      title: 'Pie Chart',
      data: sampleData,
      type: 'pie',
    },
  ];

  it('renders all charts correctly', () => {
    render(<AnalyticsDashboard charts={sampleCharts} />);
    
    expect(screen.getByText('Line Chart')).toBeInTheDocument();
    expect(screen.getByText('Bar Chart')).toBeInTheDocument();
    expect(screen.getByText('Pie Chart')).toBeInTheDocument();
  });

  it('renders different chart types', () => {
    render(<AnalyticsDashboard charts={sampleCharts} />);
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('renders AI insights when provided', () => {
    const aiInsights = {
      title: 'AI Insights',
      insights: ['Insight 1', 'Insight 2'],
      confidence: 85,
    };

    render(<AnalyticsDashboard charts={sampleCharts} aiInsights={aiInsights} />);
    
    expect(screen.getByText('AI Insights')).toBeInTheDocument();
    expect(screen.getByText('Insight 1')).toBeInTheDocument();
    expect(screen.getByText('Insight 2')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('handles chart click events', () => {
    const onChartClick = jest.fn();
    render(<AnalyticsDashboard charts={sampleCharts} onChartClick={onChartClick} />);
    
    // Click on a chart container
    const chartContainer = screen.getByText('Line Chart').closest('div');
    if (chartContainer) {
      fireEvent.click(chartContainer);
    }
  });

  it('applies different layouts correctly', () => {
    const { rerender } = render(
      <AnalyticsDashboard charts={sampleCharts} layout="grid" />
    );
    
    // Test grid layout
    expect(screen.getByText('Line Chart')).toBeInTheDocument();
    
    // Test single layout
    rerender(<AnalyticsDashboard charts={sampleCharts} layout="single" />);
    expect(screen.getByText('Line Chart')).toBeInTheDocument();
    
    // Test masonry layout
    rerender(<AnalyticsDashboard charts={sampleCharts} layout="masonry" />);
    expect(screen.getByText('Line Chart')).toBeInTheDocument();
  });

  it('handles interactive mode', () => {
    render(<AnalyticsDashboard charts={sampleCharts} interactive={true} />);
    
    // All charts should be rendered
    expect(screen.getByText('Line Chart')).toBeInTheDocument();
    expect(screen.getByText('Bar Chart')).toBeInTheDocument();
    expect(screen.getByText('Pie Chart')).toBeInTheDocument();
  });

  it('handles non-interactive mode', () => {
    render(<AnalyticsDashboard charts={sampleCharts} interactive={false} />);
    
    // Charts should still render but without interactive features
    expect(screen.getByText('Line Chart')).toBeInTheDocument();
  });

  it('renders area chart correctly', () => {
    const areaChart: AnalyticsData = {
      title: 'Area Chart',
      data: sampleData,
      type: 'area',
      gradient: true,
    };

    render(<AnalyticsDashboard charts={[areaChart]} />);
    
    expect(screen.getByText('Area Chart')).toBeInTheDocument();
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('renders radial chart correctly', () => {
    const radialChart: AnalyticsData = {
      title: 'Radial Chart',
      data: sampleData,
      type: 'radial',
    };

    render(<AnalyticsDashboard charts={[radialChart]} />);
    
    expect(screen.getByText('Radial Chart')).toBeInTheDocument();
    expect(screen.getByTestId('radial-chart')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnalyticsDashboard charts={sampleCharts} className="custom-dashboard" />
    );
    
    expect(container.firstChild).toHaveClass('custom-dashboard');
  });

  it('renders grid and legend when specified', () => {
    const chartWithGrid: AnalyticsData = {
      title: 'Chart with Grid',
      data: sampleData,
      type: 'line',
      showGrid: true,
      showLegend: true,
    };

    render(<AnalyticsDashboard charts={[chartWithGrid]} />);
    
    expect(screen.getByTestId('grid')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });
});

describe('generateSampleData', () => {
  it('generates correct number of data points', () => {
    const data = generateSampleData('line', 5);
    expect(data).toHaveLength(5);
  });

  it('generates data with correct structure', () => {
    const data = generateSampleData('bar', 3);
    
    data.forEach(point => {
      expect(point).toHaveProperty('name');
      expect(point).toHaveProperty('value');
      expect(point).toHaveProperty('category');
      expect(typeof point.value).toBe('number');
    });
  });

  it('generates default 7 data points when count not specified', () => {
    const data = generateSampleData('pie');
    expect(data).toHaveLength(7);
  });

  it('generates values within expected range', () => {
    const data = generateSampleData('area', 10);
    
    data.forEach(point => {
      expect(point.value).toBeGreaterThanOrEqual(10);
      expect(point.value).toBeLessThanOrEqual(110);
    });
  });
});