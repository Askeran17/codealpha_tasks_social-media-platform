import { useEffect, useState, useCallback } from 'react';
import {
  PHeading,
  PText,
  PButton,
  PButtonPure,
  PTextarea,
  PSpinner,
  PDivider,
} from '@porsche-design-system/components-react';
import { Menu, X, Home, User, LogOut } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import type { Post } from '../types';

interface Props {
  onNavigate: (page: string, userId?: string) => void;
}

export default function FeedPage({ onNavigate }: Props) {
  const { user, profile, signOut } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<'feed' | 'explore'>('feed');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getPosts(tab);
      setPosts(data ?? []);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  }, [user, tab]);

  useEffect(() => {
    setLoading(true);
    fetchPosts();
  }, [fetchPosts]);

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPostContent.trim() || !user) return;
    setSubmitting(true);
    try {
      await api.createPost(newPostContent.trim());
      setNewPostContent('');
      fetchPosts();
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Top nav */}
      <header className="bg-surface border-b border-contrast-low sticky top-0 z-10 relative" style={{ boxShadow: '0px 3px 8px rgba(0,0,0,.06)' }}>
        <div className="max-w-2xl mx-auto px-fluid-md py-static-sm flex items-center justify-between">
          <PHeading size="medium" tag="h1">Mini Social Media App</PHeading>
          
          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-static-sm">
            <PButtonPure
              icon="home"
              onClick={() => onNavigate('landing')}
              aria={{ 'aria-label': 'Back to landing page' }}
            >
              Home
            </PButtonPure>
            <PButtonPure
              icon="user"
              onClick={() => onNavigate('profile', user?.id)}
              aria={{ 'aria-label': 'My profile' }}
            >
              {profile?.username}
            </PButtonPure>
            <PButtonPure
              icon="logout"
              hideLabel
              aria={{ 'aria-label': 'Sign out' }}
              onClick={signOut}
            />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden text-black hover:bg-black/5 p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center border border-contrast-low"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`sm:hidden bg-surface border-b border-contrast-low absolute left-0 right-0 top-full shadow-md transition-all duration-300 ease-in-out origin-top overflow-hidden z-25 ${
            isMenuOpen
              ? 'opacity-100 scale-y-100 max-h-[300px] border-t border-contrast-low/30'
              : 'opacity-0 scale-y-95 max-h-0 pointer-events-none'
          }`}
        >
          <div className="px-fluid-md py-2 flex flex-col gap-1">
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onNavigate('landing');
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-contrast-low/20 rounded-xl text-sm font-medium text-black transition-colors cursor-pointer"
            >
              <Home size={18} className="text-black" />
              <span>Home</span>
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onNavigate('profile', user?.id);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-contrast-low/20 rounded-xl text-sm font-medium text-black transition-colors cursor-pointer"
            >
              <User size={18} className="text-black" />
              <span>{profile?.username || 'Profile'}</span>
            </button>
            <div className="h-[1px] bg-contrast-low/30 my-1" />
            <button
              onClick={() => {
                setIsMenuOpen(false);
                signOut();
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-red-50 text-sm font-medium text-red-600 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut size={18} className="text-red-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-fluid-md py-fluid-md">
        {/* Create post */}
        <section className="bg-surface rounded-lg p-fluid-md mb-fluid-md" style={{ boxShadow: '0px 3px 8px rgba(0,0,0,.06)' }}>
          <form onSubmit={handleCreatePost} className="flex flex-col gap-static-sm">
            <PTextarea
              label="What's on your mind?"
              hideLabel
              name="post"
              value={newPostContent}
              onInput={(e) => setNewPostContent((e.target as HTMLTextAreaElement).value)}
              placeholder={`What's on your mind, ${profile?.username ?? ''}?`}
              rows={3}
              resize="none"
              maxLength={1000}
              counter
            />
            <div className="flex justify-between items-center">
              <PText size="x-small" className="text-contrast-medium">
                {newPostContent.length > 0 ? `${newPostContent.length}/1000` : ''}
              </PText>
              <PButton
                type="submit"
                loading={submitting}
                disabled={!newPostContent.trim()}
                icon="send"
              >
                Post
              </PButton>
            </div>
          </form>
        </section>

        {/* Tabs */}
        <div className="flex gap-1 mb-fluid-md bg-white/85 backdrop-blur-md p-1 rounded-xl w-fit border border-white/50" style={{ boxShadow: '0px 3px 12px rgba(0,0,0,.08)' }}>
          <button
            type="button"
            onClick={() => setTab('feed')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              tab === 'feed'
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-800 hover:bg-black/5'
            }`}
          >
            My Feed
          </button>
          <button
            type="button"
            onClick={() => setTab('explore')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              tab === 'explore'
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-800 hover:bg-black/5'
            }`}
          >
            Explore
          </button>
        </div>

        <PDivider className="mb-fluid-md" />

        {/* Posts */}
        {loading ? (
          <div className="flex justify-center py-fluid-xl">
            <PSpinner size="medium" aria={{ 'aria-label': 'Loading posts' }} />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-fluid-xl">
            <PText className="text-contrast-medium" size="large">
              {tab === 'feed'
                ? 'No posts yet. Follow people to see their posts, or switch to Explore.'
                : 'No posts yet. Be the first to post!'}
            </PText>
          </div>
        ) : (
          <div className="flex flex-col gap-fluid-sm">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUpdate={fetchPosts}
                onProfileClick={(userId) => onNavigate('profile', userId)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
