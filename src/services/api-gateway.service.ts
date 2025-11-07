import { supabase } from '@/lib/supabase';
import { SecurityService } from './security.service';
import { LoggingService } from './logging.service';

export interface APIRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  userId?: string;
  role?: string;
}

export interface APIResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message: string;
}

export class APIGatewayService {
  private securityService: SecurityService;
  private loggingService: LoggingService;
  private rateLimitStore: Map<string, { count: number; resetTime: number }>;
  private rateLimitConfig: RateLimitConfig;

  constructor() {
    this.securityService = new SecurityService();
    this.loggingService = new LoggingService();
    this.rateLimitStore = new Map();
    this.rateLimitConfig = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      message: 'Too many requests, please try again later.'
    };
  }

  /**
   * Process an API request with security, rate limiting, and logging
   */
  async processRequest(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Rate limiting check
      const rateLimitResult = await this.checkRateLimit(request);
      if (!rateLimitResult.allowed) {
        return this.createErrorResponse(429, rateLimitResult.message);
      }

      // 2. Authentication and authorization
      const authResult = await this.authenticateRequest(request);
      if (!authResult.authenticated) {
        return this.createErrorResponse(401, 'Authentication required');
      }

      // 3. Input validation and sanitization
      const validationResult = await this.validateRequest(request);
      if (!validationResult.valid) {
        return this.createErrorResponse(400, validationResult.message);
      }

      // 4. Route the request to appropriate handler
      const response = await this.routeRequest(request);

      // 5. Log the request
      await this.logRequest(request, response, Date.now() - startTime);

      return response;

    } catch (error) {
      // Log error and return error response
      await this.loggingService.logError('API Gateway Error', {
        request,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      return this.createErrorResponse(500, 'Internal server error');
    }
  }

  /**
   * Check rate limiting for the request
   */
  private async checkRateLimit(request: APIRequest): Promise<{ allowed: boolean; message?: string }> {
    const key = this.getRateLimitKey(request);
    const now = Date.now();
    
    const current = this.rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      // Reset or initialize rate limit
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.rateLimitConfig.windowMs
      });
      return { allowed: true };
    }

    if (current.count >= this.rateLimitConfig.maxRequests) {
      return { 
        allowed: false, 
        message: this.rateLimitConfig.message 
      };
    }

    // Increment count
    current.count++;
    this.rateLimitStore.set(key, current);
    
    return { allowed: true };
  }

  /**
   * Authenticate and authorize the request
   */
  private async authenticateRequest(request: APIRequest): Promise<{ authenticated: boolean; user?: any }> {
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      return { authenticated: false };
    }

    try {
      // Verify JWT token
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return { authenticated: false };
      }

      // Check if user is active
      if (!user.email_confirmed_at) {
        return { authenticated: false };
      }

      return { authenticated: true, user };
    } catch (error) {
      return { authenticated: false };
    }
  }

  /**
   * Validate and sanitize the request
   */
  private async validateRequest(request: APIRequest): Promise<{ valid: boolean; message?: string }> {
    // Check method
    const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!allowedMethods.includes(request.method.toUpperCase())) {
      return { valid: false, message: 'Method not allowed' };
    }

    // Check path
    if (!request.path || request.path.length > 1000) {
      return { valid: false, message: 'Invalid path' };
    }

    // Sanitize headers
    const sanitizedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === 'string' && value.length < 1000) {
        sanitizedHeaders[key.toLowerCase()] = value;
      }
    }
    request.headers = sanitizedHeaders;

    // Validate body for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase()) && request.body) {
      if (typeof request.body !== 'object') {
        return { valid: false, message: 'Invalid request body' };
      }

      // Check body size
      const bodySize = JSON.stringify(request.body).length;
      if (bodySize > 1024 * 1024) { // 1MB limit
        return { valid: false, message: 'Request body too large' };
      }
    }

    return { valid: true };
  }

  /**
   * Route the request to appropriate handler
   */
  private async routeRequest(request: APIRequest): Promise<APIResponse> {
    const { method, path } = request;

    // Define route handlers
    const routes: Record<string, (req: APIRequest) => Promise<APIResponse>> = {
      'GET:/api/health': this.handleHealthCheck.bind(this),
      'GET:/api/analytics': this.handleAnalytics.bind(this),
      'POST:/api/sessions': this.handleCreateSession.bind(this),
      'GET:/api/sessions': this.handleGetSessions.bind(this),
      'PUT:/api/sessions/:id': this.handleUpdateSession.bind(this),
      'DELETE:/api/sessions/:id': this.handleDeleteSession.bind(this),
      'POST:/api/auth/qr/verify': this.handleQRVerification.bind(this),
      'GET:/api/export': this.handleDataExport.bind(this),
    };

    const routeKey = `${method.toUpperCase()}:${path}`;
    const handler = routes[routeKey];

    if (!handler) {
      return this.createErrorResponse(404, 'Route not found');
    }

    return await handler(request);
  }

  /**
   * Route handlers
   */
  private async handleHealthCheck(request: APIRequest): Promise<APIResponse> {
    return {
      status: 200,
      data: { status: 'healthy', timestamp: new Date().toISOString() },
      headers: { 'Content-Type': 'application/json' }
    };
  }

  private async handleAnalytics(request: APIRequest): Promise<APIResponse> {
    // Implementation for analytics endpoint
    return {
      status: 200,
      data: { message: 'Analytics endpoint' },
      headers: { 'Content-Type': 'application/json' }
    };
  }

  private async handleCreateSession(request: APIRequest): Promise<APIResponse> {
    // Implementation for creating sessions
    return {
      status: 201,
      data: { message: 'Session created' },
      headers: { 'Content-Type': 'application/json' }
    };
  }

  private async handleGetSessions(request: APIRequest): Promise<APIResponse> {
    // Implementation for getting sessions
    return {
      status: 200,
      data: { sessions: [] },
      headers: { 'Content-Type': 'application/json' }
    };
  }

  private async handleUpdateSession(request: APIRequest): Promise<APIResponse> {
    // Implementation for updating sessions
    return {
      status: 200,
      data: { message: 'Session updated' },
      headers: { 'Content-Type': 'application/json' }
    };
  }

  private async handleDeleteSession(request: APIRequest): Promise<APIResponse> {
    // Implementation for deleting sessions
    return {
      status: 204,
      data: null,
      headers: {}
    };
  }

  private async handleQRVerification(request: APIRequest): Promise<APIResponse> {
    // Implementation for QR code verification
    return {
      status: 200,
      data: { verified: true },
      headers: { 'Content-Type': 'application/json' }
    };
  }

  private async handleDataExport(request: APIRequest): Promise<APIResponse> {
    // Implementation for data export
    return {
      status: 200,
      data: { exportUrl: 'https://example.com/export.csv' },
      headers: { 'Content-Type': 'application/json' }
    };
  }

  /**
   * Log the request and response
   */
  private async logRequest(request: APIRequest, response: APIResponse, duration: number): Promise<void> {
    await this.loggingService.logInfo('API Request', {
      method: request.method,
      path: request.path,
      status: response.status,
      duration,
      userId: request.userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Create error response
   */
  private createErrorResponse(status: number, message: string): APIResponse {
    return {
      status,
      data: { error: message },
      headers: { 'Content-Type': 'application/json' }
    };
  }

  /**
   * Get rate limit key for the request
   */
  private getRateLimitKey(request: APIRequest): string {
    return `${request.userId || 'anonymous'}:${request.path}`;
  }

  /**
   * Update rate limit configuration
   */
  updateRateLimitConfig(config: Partial<RateLimitConfig>): void {
    this.rateLimitConfig = { ...this.rateLimitConfig, ...config };
  }

  /**
   * Get current rate limit statistics
   */
  getRateLimitStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [key, value] of this.rateLimitStore.entries()) {
      stats[key] = {
        count: value.count,
        resetTime: new Date(value.resetTime).toISOString(),
        remaining: Math.max(0, this.rateLimitConfig.maxRequests - value.count)
      };
    }
    
    return stats;
  }

  /**
   * Clear rate limit store
   */
  clearRateLimitStore(): void {
    this.rateLimitStore.clear();
  }
}