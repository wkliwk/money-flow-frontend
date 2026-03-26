import { getToken, clearToken, setToken, isAuthenticated } from '../services/auth';

let requestFn: (config: any) => any;
let responseSuccessFn: (res: any) => any;
let responseErrorFn: (err: any) => any;

jest.mock('axios', () => {
  const instance = {
    interceptors: {
      request: {
        use: jest.fn((fn: any) => {
          requestFn = fn;
        }),
      },
      response: {
        use: jest.fn((success: any, error: any) => {
          responseSuccessFn = success;
          responseErrorFn = error;
        }),
      },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };
  return {
    __esModule: true,
    default: { create: jest.fn(() => instance) },
  };
});

// Force axiosInstance module to load after mock is in place
require('../axiosInstance');

describe('auth service', () => {
  const KEY = 'mf_token';

  beforeEach(() => localStorage.clear());

  it('getToken returns null when no token stored', () => {
    expect(getToken()).toBeNull();
  });

  it('setToken stores a token', () => {
    setToken('abc123');
    expect(localStorage.getItem(KEY)).toBe('abc123');
  });

  it('getToken returns stored token', () => {
    localStorage.setItem(KEY, 'test-token');
    expect(getToken()).toBe('test-token');
  });

  it('clearToken removes the token', () => {
    localStorage.setItem(KEY, 'test-token');
    clearToken();
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('isAuthenticated returns false when no token', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('isAuthenticated returns true when token exists', () => {
    localStorage.setItem(KEY, 'test-token');
    expect(isAuthenticated()).toBe(true);
  });
});

describe('axiosInstance interceptors', () => {
  beforeEach(() => localStorage.clear());

  it('request interceptor attaches Bearer token when present', () => {
    localStorage.setItem('mf_token', 'my-jwt');
    const config = { headers: {} as Record<string, string> };
    const result = requestFn(config);
    expect(result.headers.Authorization).toBe('Bearer my-jwt');
  });

  it('request interceptor skips token when absent', () => {
    const config = { headers: {} as Record<string, string> };
    const result = requestFn(config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('response interceptor passes through successful responses', () => {
    const res = { data: 'ok', status: 200 };
    expect(responseSuccessFn(res)).toBe(res);
  });

  it('response interceptor clears token on 401', async () => {
    localStorage.setItem('mf_token', 'token');
    const err = { response: { status: 401 } };
    await expect(responseErrorFn(err)).rejects.toEqual(err);
    expect(localStorage.getItem('mf_token')).toBeNull();
  });

  it('response interceptor rejects non-401 errors without clearing token', async () => {
    localStorage.setItem('mf_token', 'token');
    const err = { response: { status: 500 } };
    await expect(responseErrorFn(err)).rejects.toEqual(err);
    expect(localStorage.getItem('mf_token')).toBe('token');
  });
});
