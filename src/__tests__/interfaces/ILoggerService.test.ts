import { ILoggerService } from '../../interfaces/ILoggerService.ts';

describe('ILoggerService Interface', () => {
  // This is a type-level test to ensure the interface has all required methods
  it('should have the correct method signatures', () => {
    // Create a mock implementation that satisfies the interface
    const mockLogger: ILoggerService = {
      info: jest.fn((message: string, meta?: Record<string, unknown>) => {}),
      warn: jest.fn((message: string, meta?: Record<string, unknown>) => {}),
      error: jest.fn((message: string, error: unknown, meta?: Record<string, unknown>) => {}),
      debug: jest.fn((message: string, meta?: Record<string, unknown>) => {}),
      child: jest.fn((context: Record<string, unknown>) => mockLogger),
    };

    // Verify methods exist by calling them (this is just to check compilation)
    mockLogger.info('test message');
    mockLogger.info('test message with meta', { test: 'value' });
    mockLogger.warn('test warning');
    mockLogger.error('test error', new Error('test'));
    mockLogger.debug('test debug');
    const childLogger = mockLogger.child({ context: 'test' });

    // This test doesn't have assertions - it passes if it compiles
    expect(mockLogger).toBeDefined();
    expect(childLogger).toBeDefined();
  });
});
