import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

function mockFetchResponse(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe('api', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends requests without an Authorization header when no token is stored', async () => {
    (fetch as any).mockResolvedValueOnce(mockFetchResponse([]));

    await api.getPosts();

    const [, options] = (fetch as any).mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('attaches a bearer token from localStorage on subsequent requests', async () => {
    localStorage.setItem('token', 'my-token');
    (fetch as any).mockResolvedValueOnce(mockFetchResponse([]));

    await api.getPosts();

    const [, options] = (fetch as any).mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer my-token');
  });

  it('stores the access token in localStorage on successful login', async () => {
    (fetch as any).mockResolvedValueOnce(
      mockFetchResponse({ session: { access_token: 'abc123' }, profile: { id: '1' } })
    );

    await api.login('user@example.com', 'password123');

    expect(localStorage.getItem('token')).toBe('abc123');
  });

  it('throws with the server error message when login fails', async () => {
    (fetch as any).mockResolvedValueOnce(mockFetchResponse({ error: 'Invalid email or password' }));

    await expect(api.login('user@example.com', 'wrong')).rejects.toThrow('Invalid email or password');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('throws an HTTP error when the response is not ok and has no error body', async () => {
    (fetch as any).mockResolvedValueOnce(mockFetchResponse({}, false, 500));

    await expect(api.getPosts()).rejects.toThrow('HTTP error! status: 500');
  });

  it('removes the token from localStorage on logout', async () => {
    localStorage.setItem('token', 'abc123');
    await api.logout();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('requests the feed with the correct query string', async () => {
    (fetch as any).mockResolvedValueOnce(mockFetchResponse([]));

    await api.getPosts('feed');

    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain('/posts?type=feed');
  });
});
