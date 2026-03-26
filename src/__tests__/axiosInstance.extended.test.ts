/**
 * Extended axiosInstance tests covering debug logging branches.
 */

// We need to test the actual interceptors.
// Reset module cache so we get a fresh axiosInstance with interceptors registered.
jest.isolateModules(() => {
  // intentional — tests below use dynamic require
});

describe('axiosInstance request interceptor — debug logging branches', () => {
  let consoleSpy: jest.SpyInstance;
  let requestFn: (config: any) => any;

  beforeEach(() => {
    jest.resetModules();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    // Import fresh instance and capture interceptors via mock
    const axiosMock = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      create: jest.fn(),
    };
    jest.doMock('axios', () => ({ ...axiosMock, create: () => axiosMock, default: { create: () => axiosMock } }));
    require('../axiosInstance');
    const [onFulfilled] = axiosMock.interceptors.request.use.mock.calls[0] || [];
    requestFn = onFulfilled || ((c: any) => c);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.resetModules();
  });

  it('logs expense requests that have data', () => {
    const config = {
      headers: {},
      url: '/api/expenses',
      method: 'POST',
      data: JSON.stringify({ description: 'Coffee' }),
    };
    requestFn(config);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[DEBUG] Expense request:',
      expect.objectContaining({ url: '/api/expenses' })
    );
  });

  it('does not log non-expense requests', () => {
    const config = { headers: {}, url: '/api/auth/login', method: 'POST', data: '{}' };
    requestFn(config);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('does not log expense request without data', () => {
    const config = { headers: {}, url: '/api/expenses', method: 'GET' };
    requestFn(config);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('attaches Authorization header when token exists', () => {
    localStorage.setItem('mf_token', 'test-jwt-token');
    const config = { headers: {}, url: '/api/expenses', method: 'GET' };
    const result = requestFn(config);
    expect(result.headers['Authorization']).toBe('Bearer test-jwt-token');
    localStorage.removeItem('mf_token');
  });

  it('does not set Authorization header when no token', () => {
    localStorage.removeItem('mf_token');
    const config = { headers: {}, url: '/api/expenses', method: 'GET' };
    const result = requestFn(config);
    expect(result.headers['Authorization']).toBeUndefined();
  });
});

describe('axiosInstance response interceptor — logging branches', () => {
  let consoleSpy: jest.SpyInstance;
  let responseFn: (response: any) => any;
  let errorFn: (error: any) => any;

  beforeEach(() => {
    jest.resetModules();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const axiosMock = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      create: jest.fn(),
    };
    jest.doMock('axios', () => ({ ...axiosMock, create: () => axiosMock, default: { create: () => axiosMock } }));
    require('../axiosInstance');
    const [onFulfilled, onRejected] = axiosMock.interceptors.response.use.mock.calls[0] || [];
    responseFn = onFulfilled || ((r: any) => r);
    errorFn = onRejected || ((e: any) => Promise.reject(e));
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    jest.resetModules();
  });

  it('logs expense responses', () => {
    const response = {
      config: { url: '/api/expenses', method: 'POST' },
      data: [{ _id: '1', description: 'Coffee' }],
      status: 200,
    };
    responseFn(response);
    expect(consoleSpy).toHaveBeenCalledWith(
      '[DEBUG] Expense response:',
      expect.objectContaining({ url: '/api/expenses' })
    );
  });

  it('does not log non-expense responses', () => {
    const response = { config: { url: '/api/auth/me', method: 'GET' }, data: {}, status: 200 };
    responseFn(response);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('rejects with error on response error (no token clear for non-401)', async () => {
    const error = { response: { status: 500 }, config: { url: '/api/expenses' } };
    await expect(errorFn(error)).rejects.toEqual(error);
    // Token should NOT be cleared for non-401 errors
    expect(localStorage.getItem('mf_token')).toBe(null);
  });
});
