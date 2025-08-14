'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRAuthService } from '@/services/qr-auth.service';
import { wsService } from '@/services/websocket.service';

interface TestResult {
  id: string;
  testName: string;
  status: 'running' | 'passed' | 'failed';
  duration: number;
  details: string;
  timestamp: Date;
}

export function QRCodeTester() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  const qrAuthService = QRAuthService.getInstance();

  const tests = [
    {
      name: 'QR Code Generation',
      description: 'Test QR code generation with AI enhancement',
      test: async () => {
        const result = await qrAuthService.generateQRCode('test-device');
        if (!result.qrCode || !result.sessionId) {
          throw new Error('QR code generation failed');
        }
        return `Generated QR code with session ID: ${result.sessionId}`;
      }
    },
    {
      name: 'AI Security Context',
      description: 'Test AI-enhanced security context generation',
      test: async () => {
        const result = await qrAuthService.generateQRCode('test-device-ai');
        if (!result.aiInsights) {
          throw new Error('AI insights not generated');
        }
        return `AI insights generated with risk score: ${result.aiInsights.riskScore}`;
      }
    },
    {
      name: 'Token Verification',
      description: 'Test QR token verification process',
      test: async () => {
        // First generate a QR code
        const qrResult = await qrAuthService.generateQRCode('test-device-verify');
        
        // Extract token from QR code data
        const qrData = JSON.parse(atob(qrResult.qrCode.split(',')[1]));
        const tokenData = JSON.parse(qrData);
        
        // Verify the token
        const verifyResult = await qrAuthService.verifyQRToken(
          tokenData.token,
          'test-user-agent',
          '127.0.0.1'
        );
        
        if (!verifyResult.isValid) {
          throw new Error('Token verification failed');
        }
        
        return `Token verified successfully for session: ${verifyResult.sessionId}`;
      }
    },
    {
      name: 'WebSocket Connection',
      description: 'Test real-time WebSocket updates',
      test: async () => {
        await wsService.connect();
        const isConnected = wsService.isConnected();
        
        if (!isConnected) {
          throw new Error('WebSocket connection failed');
        }
        
        return 'WebSocket connected successfully';
      }
    },
    {
      name: 'AI Agent Integration',
      description: 'Test AI agent orchestrator integration',
      test: async () => {
        const result = await qrAuthService.generateQRCode('test-ai-agent');
        
        // Check if AI insights were generated (indicates agent integration)
        if (!result.aiInsights || typeof result.aiInsights.riskScore !== 'number') {
          throw new Error('AI agent integration failed');
        }
        
        return `AI agents integrated successfully, risk score: ${result.aiInsights.riskScore}`;
      }
    },
    {
      name: 'Token Expiration',
      description: 'Test QR code token expiration handling',
      test: async () => {
        const result = await qrAuthService.generateQRCode('test-expiration');
        const expirationTime = result.expiresAt.getTime() - Date.now();
        
        if (expirationTime <= 0 || expirationTime > 300000) { // Should be ~5 minutes
          throw new Error('Token expiration time is incorrect');
        }
        
        return `Token expiration set correctly: ${Math.round(expirationTime / 1000)}s`;
      }
    },
    {
      name: 'Error Handling',
      description: 'Test error handling for invalid tokens',
      test: async () => {
        const result = await qrAuthService.verifyQRToken('invalid-token');
        
        if (result.isValid) {
          throw new Error('Invalid token was accepted');
        }
        
        return 'Error handling works correctly for invalid tokens';
      }
    },
    {
      name: 'Authentication Stats',
      description: 'Test authentication statistics tracking',
      test: async () => {
        const stats = qrAuthService.getAuthStats();
        
        if (typeof stats.activeTokens !== 'number' || typeof stats.activeConnections !== 'number') {
          throw new Error('Authentication stats not properly tracked');
        }
        
        return `Stats tracked: ${stats.activeTokens} tokens, ${stats.activeConnections} connections`;
      }
    }
  ];

  const runTest = async (testConfig: typeof tests[0]): Promise<TestResult> => {
    const startTime = Date.now();
    const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      setCurrentTest(testConfig.name);
      const details = await testConfig.test();
      const duration = Date.now() - startTime;
      
      return {
        id: testId,
        testName: testConfig.name,
        status: 'passed',
        duration,
        details,
        timestamp: new Date(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        id: testId,
        testName: testConfig.name,
        status: 'failed',
        duration,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCurrentTest(null);

    const results: TestResult[] = [];

    for (const testConfig of tests) {
      const result = await runTest(testConfig);
      results.push(result);
      setTestResults([...results]);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setCurrentTest(null);
    setIsRunning(false);
  };

  const runSingleTest = async (testIndex: number) => {
    setIsRunning(true);
    const result = await runTest(tests[testIndex]);
    setTestResults(prev => [...prev.filter(r => r.testName !== result.testName), result]);
    setCurrentTest(null);
    setIsRunning(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return 'text-success-600 bg-success-100';
      case 'failed': return 'text-error-600 bg-error-100';
      case 'running': return 'text-primary-600 bg-primary-100';
      default: return 'text-neutral-600 bg-neutral-100';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return '✓';
      case 'failed': return '✗';
      case 'running': return '⟳';
      default: return '○';
    }
  };

  const passedTests = testResults.filter(r => r.status === 'passed').length;
  const failedTests = testResults.filter(r => r.status === 'failed').length;
  const totalTests = tests.length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">
          QR Code Authentication Tester
        </h1>
        <p className="text-neutral-600">
          Comprehensive testing suite for QR authentication functionality
        </p>
      </div>

      {/* Test Summary */}
      <div className="bg-white rounded-2xl shadow-soft p-6 border border-neutral-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-800">Test Summary</h2>
          <div className="flex space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">{passedTests}</div>
              <div className="text-xs text-success-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-error-600">{failedTests}</div>
              <div className="text-xs text-error-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neutral-600">{totalTests}</div>
              <div className="text-xs text-neutral-600">Total</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-neutral-200 rounded-full h-2 mb-4">
          <motion.div
            className="bg-gradient-to-r from-primary-500 to-success-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(testResults.length / totalTests) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <motion.button
            onClick={runAllTests}
            disabled={isRunning}
            className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 text-white font-medium rounded-xl transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </motion.button>
          
          <motion.button
            onClick={() => setTestResults([])}
            disabled={isRunning}
            className="px-4 py-3 bg-neutral-100 hover:bg-neutral-200 disabled:bg-neutral-50 text-neutral-700 font-medium rounded-xl transition-colors duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Clear Results
          </motion.button>
        </div>
      </div>

      {/* Current Test */}
      <AnimatePresence>
        {currentTest && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-primary-50 border border-primary-200 rounded-2xl p-4"
          >
            <div className="flex items-center space-x-3">
              <motion.div
                className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <div>
                <h3 className="font-semibold text-primary-800">Running Test</h3>
                <p className="text-sm text-primary-600">{currentTest}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test List */}
      <div className="space-y-4">
        {tests.map((testConfig, index) => {
          const result = testResults.find(r => r.testName === testConfig.name);
          const isCurrentTest = currentTest === testConfig.name;
          
          return (
            <motion.div
              key={testConfig.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-white rounded-2xl shadow-soft p-6 border transition-all duration-300 ${
                isCurrentTest ? 'border-primary-300 bg-primary-50' : 'border-neutral-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-neutral-800">{testConfig.name}</h3>
                    {result && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${getStatusColor(result.status)}`}
                      >
                        {getStatusIcon(result.status)}
                      </motion.div>
                    )}
                  </div>
                  <p className="text-sm text-neutral-600 mb-3">{testConfig.description}</p>
                  
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-neutral-50 rounded-lg p-3 text-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-neutral-700">Result:</span>
                        <span className="text-xs text-neutral-500">
                          {result.duration}ms
                        </span>
                      </div>
                      <p className={`${result.status === 'failed' ? 'text-error-700' : 'text-success-700'}`}>
                        {result.details}
                      </p>
                    </motion.div>
                  )}
                </div>
                
                <motion.button
                  onClick={() => runSingleTest(index)}
                  disabled={isRunning}
                  className="ml-4 px-3 py-1 bg-neutral-100 hover:bg-neutral-200 disabled:bg-neutral-50 text-neutral-700 text-sm font-medium rounded-lg transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isCurrentTest ? 'Running...' : 'Test'}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}