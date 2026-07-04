import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PorscheDesignSystemProvider } from '@porsche-design-system/components-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PostCard from './PostCard';
import { AuthProvider } from '../contexts/AuthContext';
import { api } from '../lib/api';
import type { Post } from '../types';

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <PorscheDesignSystemProvider theme="light">
      <AuthProvider>{ui}</AuthProvider>
    </PorscheDesignSystemProvider>
  );
}

const { currentUser } = vi.hoisted(() => ({
  currentUser: { id: 'user-2', email: 'viewer@example.com', user_metadata: { username: 'viewer' } },
}));

vi.mock('../lib/api', () => ({
  api: {
    getCurrentUser: vi.fn().mockResolvedValue({ user: currentUser, profile: currentUser }),
    toggleLike: vi.fn().mockResolvedValue({ liked: true }),
  },
}));

const post: Post = {
  id: 'post-1',
  user_id: 'user-1',
  content: 'Hello from a test post',
  created_at: new Date().toISOString(),
  profiles: { id: 'user-1', username: 'tester', bio: '', created_at: new Date().toISOString() },
  likes: [],
  comments: [],
};

describe('PostCard', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'valid-token');
  });

  it('renders the post content and author', async () => {
    renderWithProviders(<PostCard post={post} onUpdate={() => {}} onProfileClick={() => {}} />);

    expect(await screen.findByText('Hello from a test post')).toBeInTheDocument();
    expect(screen.getByText('tester')).toBeInTheDocument();
  });

  it('calls onUpdate after liking a post', async () => {
    const onUpdate = vi.fn();
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <PostCard post={post} onUpdate={onUpdate} onProfileClick={() => {}} />
    );

    await screen.findByText('Hello from a test post');
    const likeButton = container.querySelector('p-button-pure');
    expect(likeButton).not.toBeNull();
    await user.click(likeButton as Element);

    expect(api.toggleLike).toHaveBeenCalledWith('post-1');
    expect(onUpdate).toHaveBeenCalled();
  });
});
