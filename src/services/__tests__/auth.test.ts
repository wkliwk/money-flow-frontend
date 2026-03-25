import { getToken, setToken, clearToken, isAuthenticated } from '../auth';

describe('auth service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getToken returns null when nothing stored', () => {
    expect(getToken()).toBeNull();
  });

  it('setToken stores token and getToken retrieves it', () => {
    setToken('abc123');
    expect(getToken()).toBe('abc123');
  });

  it('clearToken removes stored token', () => {
    setToken('abc123');
    clearToken();
    expect(getToken()).toBeNull();
  });

  it('isAuthenticated returns false when no token', () => {
    expect(isAuthenticated()).toBe(false);
  });

  it('isAuthenticated returns true when token is set', () => {
    setToken('sometoken');
    expect(isAuthenticated()).toBe(true);
  });

  it('isAuthenticated returns false after clearToken', () => {
    setToken('sometoken');
    clearToken();
    expect(isAuthenticated()).toBe(false);
  });
});
