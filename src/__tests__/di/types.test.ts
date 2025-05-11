import { TYPES } from '../../di/types.ts';

describe('Dependency Injection Types', () => {
  it('should define all required types', () => {
    expect(TYPES.ResponseHandler).toBeDefined();
    expect(TYPES.CaseHelper).toBeDefined();
    expect(TYPES.LoggerService).toBeDefined();
    expect(TYPES.CaseRepository).toBeDefined();
    expect(TYPES.CaseService).toBeDefined();
    expect(TYPES.CaseController).toBeDefined();
  });

  it('should create unique symbols for each type', () => {
    const values = Object.values(TYPES);
    const uniqueValues = new Set(values);

    expect(uniqueValues.size).toBe(values.length);
  });

  it('should use Symbol.for to ensure consistent symbols across modules', () => {
    const testSymbol = Symbol.for('ResponseHandler');
    expect(TYPES.ResponseHandler).toBe(testSymbol);
  });
});
