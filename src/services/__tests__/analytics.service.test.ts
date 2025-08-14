import { AnalyticsService } from '@/services/analytics.service';

// Mock the database service
jest.mock('@/services/database.service', () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    execute: jest.fn(),
  }))
}));

// Mock the AI insights service
jest.mock('@/services/ai-insights.service', () => ({
  AIInsightsService: jest.fn().mockImplementation(() => ({
    generateInsights: jest.fn(),
    analyzePatterns: jest.fn(),
  }))
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockDatabaseService: any;
  let mockAIInsightsService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked services
    const { DatabaseService } = require('@/services/database.service');
    const { AIInsightsService } = require('@/services/ai-insights.service');
    
    mockDatabaseService = new DatabaseService();
    mockAIInsightsService = new AIInsightsService();
    
    analyticsService = new AnalyticsService();
  });

  describe('getLearningProgress', () => {
    it('returns learning progress data for a user', async () => {
      const mockData = [
        { date: '2024-01-01', progress: 75 },
        { date: '2024-01-02', progress: 80 }
      ];
      
      mockDatabaseService.query.mockResolvedValue(mockData);

      const result = await analyticsService.getLearningProgress('user-123', '30d');

      expect(result).toEqual(mockData);
      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining(['user-123', '30d'])
      );
    });

    it('handles database errors gracefully', async () => {
      mockDatabaseService.query.mockRejectedValue(new Error('Database error'));

      await expect(analyticsService.getLearningProgress('user-123', '30d'))
        .rejects.toThrow('Database error');
    });
  });

  describe('getSessionMetrics', () => {
    it('returns session metrics for a user', async () => {
      const mockData = {
        totalSessions: 25,
        averageDuration: 45,
        completionRate: 92
      };
      
      mockDatabaseService.query.mockResolvedValue([mockData]);

      const result = await analyticsService.getSessionMetrics('user-123', '30d');

      expect(result).toEqual(mockData);
    });

    it('calculates metrics correctly from raw data', async () => {
      const mockRawData = [
        { duration: 30, completed: true },
        { duration: 60, completed: true },
        { duration: 45, completed: false }
      ];
      
      mockDatabaseService.query.mockResolvedValue(mockRawData);

      const result = await analyticsService.getSessionMetrics('user-123', '30d');

      expect(result.totalSessions).toBe(3);
      expect(result.averageDuration).toBe(45);
      expect(result.completionRate).toBe(67); // 2/3 * 100
    });
  });

  describe('getTeacherPerformance', () => {
    it('returns teacher performance data for admin users', async () => {
      const mockData = [
        { teacherId: '1', name: 'John Doe', rating: 4.5, sessions: 12 },
        { teacherId: '2', name: 'Jane Smith', rating: 4.8, sessions: 15 }
      ];
      
      mockDatabaseService.query.mockResolvedValue(mockData);

      const result = await analyticsService.getTeacherPerformance('30d');

      expect(result).toEqual(mockData);
    });

    it('filters by date range correctly', async () => {
      mockDatabaseService.query.mockResolvedValue([]);

      await analyticsService.getTeacherPerformance('7d');

      expect(mockDatabaseService.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining(['7d'])
      );
    });
  });

  describe('generateReport', () => {
    it('generates a comprehensive analytics report', async () => {
      const mockProgressData = [{ date: '2024-01-01', progress: 75 }];
      const mockMetricsData = { totalSessions: 25, averageDuration: 45, completionRate: 92 };
      const mockInsights = ['Student shows improvement in math', 'Consider more practice sessions'];

      mockDatabaseService.query
        .mockResolvedValueOnce(mockProgressData)
        .mockResolvedValueOnce([mockMetricsData]);
      mockAIInsightsService.generateInsights.mockResolvedValue(mockInsights);

      const result = await analyticsService.generateReport('user-123', '30d');

      expect(result).toHaveProperty('learningProgress');
      expect(result).toHaveProperty('sessionMetrics');
      expect(result).toHaveProperty('insights');
      expect(result.insights).toEqual(mockInsights);
    });

    it('includes AI-generated insights in the report', async () => {
      const mockInsights = ['Recommendation 1', 'Recommendation 2'];
      mockDatabaseService.query.mockResolvedValue([]);
      mockAIInsightsService.generateInsights.mockResolvedValue(mockInsights);

      const result = await analyticsService.generateReport('user-123', '30d');

      expect(mockAIInsightsService.generateInsights).toHaveBeenCalled();
      expect(result.insights).toEqual(mockInsights);
    });
  });

  describe('exportData', () => {
    it('exports analytics data in CSV format', async () => {
      const mockData = [
        { date: '2024-01-01', progress: 75, sessions: 2 },
        { date: '2024-01-02', progress: 80, sessions: 3 }
      ];
      
      mockDatabaseService.query.mockResolvedValue(mockData);

      const result = await analyticsService.exportData('user-123', 'csv', '30d');

      expect(result).toContain('date,progress,sessions');
      expect(result).toContain('2024-01-01,75,2');
      expect(result).toContain('2024-01-02,80,3');
    });

    it('exports analytics data in JSON format', async () => {
      const mockData = [{ date: '2024-01-01', progress: 75 }];
      mockDatabaseService.query.mockResolvedValue(mockData);

      const result = await analyticsService.exportData('user-123', 'json', '30d');

      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      expect(parsed).toEqual(mockData);
    });

    it('throws error for unsupported format', async () => {
      await expect(analyticsService.exportData('user-123', 'xml', '30d'))
        .rejects.toThrow('Unsupported export format: xml');
    });
  });

  describe('getTrends', () => {
    it('identifies learning trends over time', async () => {
      const mockData = [
        { date: '2024-01-01', progress: 70 },
        { date: '2024-01-02', progress: 75 },
        { date: '2024-01-03', progress: 80 }
      ];
      
      mockDatabaseService.query.mockResolvedValue(mockData);

      const result = await analyticsService.getTrends('user-123', '7d');

      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('change');
      expect(result.trend).toBe('increasing');
      expect(result.change).toBe(10); // 80 - 70
    });

    it('handles decreasing trends', async () => {
      const mockData = [
        { date: '2024-01-01', progress: 80 },
        { date: '2024-01-02', progress: 75 },
        { date: '2024-01-03', progress: 70 }
      ];
      
      mockDatabaseService.query.mockResolvedValue(mockData);

      const result = await analyticsService.getTrends('user-123', '7d');

      expect(result.trend).toBe('decreasing');
      expect(result.change).toBe(-10);
    });
  });
});
