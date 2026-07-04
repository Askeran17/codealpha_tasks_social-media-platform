import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { api } from '../lib/api';

vi.mock('../lib/api', () => ({
  api: {
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('finishes loading immediately when there is no stored token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(api.getCurrentUser).not.toHaveBeenCalled();
  });

  it('restores the session when a token is stored and valid', async () => {
    localStorage.setItem('token', 'valid-token');
    const user = { id: '1', email: 'user@example.com', user_metadata: { username: 'user' } };
    const profile = { id: '1', username: 'user', bio: '', created_at: '2024-01-01' };
    (api.getCurrentUser as any).mockResolvedValueOnce({ user, profile });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual(user);
    expect(result.current.profile).toEqual(profile);
  });

  it('clears the stored token when session restoration fails', async () => {
    localStorage.setItem('token', 'expired-token');
    (api.getCurrentUser as any).mockRejectedValueOnce(new Error('Invalid or expired token'));

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('clears the user and profile on sign out', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setUser({ id: '1', email: 'user@example.com' });
      result.current.setProfile({ id: '1', username: 'user', bio: '', created_at: '2024-01-01' });
    });
    expect(result.current.user).not.toBeNull();

    await act(async () => {
      await result.current.signOut();
    });

    expect(api.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });
});
