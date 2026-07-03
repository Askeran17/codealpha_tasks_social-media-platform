import { useEffect, useState, useCallback } from 'react';
import {
  PHeading,
  PText,
  PButton,
  PButtonPure,
  PSpinner,
  PDivider,
  PTag,
  PInlineNotification,
  PTextarea,
} from '@porsche-design-system/components-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import PostCard from '../components/PostCard';
import type { Post, Profile } from '../types';

interface Props {
  userId: string;
  onNavigate: (page: string, userId?: string) => void;
}

export default function ProfilePage({ userId, onNavigate }: Props) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  const isOwnProfile = user?.id === userId;

  const fetchData = useCallback(async () => {
    try {
      const data = await api.getProfile(userId);
      setProfile(data.profile ?? null);
      setBio(data.profile?.bio ?? '');
      setPosts(data.posts ?? []);
      setFollowerCount(data.followerCount ?? 0);
      setFollowingCount(data.followingCount ?? 0);
      setIsFollowing(data.isFollowing ?? false);
    } catch (err) {
      console.error('Failed to fetch profile data:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  async function handleFollowToggle() {
    if (!user) return;
    try {
      const data = await api.toggleFollow(userId);
      setIsFollowing(data.following);
      fetchData(); // Refetch to update counts
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  }

  async function handleSaveBio() {
    if (!user) return;
    setSavingBio(true);
    try {
      const data = await api.updateBio(bio);
      setProfile(data.profile);
      setBio(data.profile?.bio ?? '');
      setEditingBio(false);
    } catch (err) {
      console.error('Failed to save bio:', err);
    } finally {
      setSavingBio(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <PSpinner size="medium" aria={{ 'aria-label': 'Loading profile' }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-fluid-md">
        <PInlineNotification state="error" heading="User not found" description="This profile does not exist." dismissButton={false} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Top nav */}
      <header className="bg-surface border-b border-contrast-low sticky top-0 z-10" style={{ boxShadow: '0px 3px 8px rgba(0,0,0,.06)' }}>
        <div className="max-w-2xl mx-auto px-fluid-md py-static-sm flex items-center justify-between">
          <div className="flex items-center gap-static-sm">
            <PButtonPure icon="arrow-left" hideLabel aria={{ 'aria-label': 'Back to feed' }} onClick={() => onNavigate('feed')} />
            <PHeading size="medium" tag="h1">Profile</PHeading>
          </div>
          <PButtonPure icon="home" hideLabel aria={{ 'aria-label': 'Back to home' }} onClick={() => onNavigate('landing')} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-fluid-md py-fluid-md">
        {/* Profile card */}
        <section className="bg-surface rounded-lg p-fluid-md mb-fluid-md" style={{ boxShadow: '0px 3px 8px rgba(0,0,0,.06)' }}>
          <div className="flex items-start gap-fluid-sm">
            {/* Avatar */}
            <div
              className="flex items-center justify-center rounded-full bg-canvas border-2 border-contrast-low text-primary font-bold shrink-0"
              style={{ width: 72, height: 72, fontSize: 28 }}
            >
              {profile.username.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-static-sm flex-wrap">
                <div>
                  <PHeading size="large" tag="h2">{profile.username}</PHeading>
                  <PText size="x-small" className="text-contrast-medium">
                    Member since {new Date(profile.created_at).toLocaleDateString()}
                  </PText>
                </div>
                {!isOwnProfile && user && (
                  <PButton
                    variant={isFollowing ? 'secondary' : 'primary'}
                    compact
                    onClick={handleFollowToggle}
                    icon={isFollowing ? 'close' : 'add'}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </PButton>
                )}
                {isOwnProfile && !editingBio && (
                  <PButtonPure icon="edit" onClick={() => setEditingBio(true)}>
                    Edit Bio
                  </PButtonPure>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-fluid-sm mt-fluid-xs">
                <div className="text-center">
                  <PText weight="semi-bold">{posts.length}</PText>
                  <PText size="x-small" className="text-contrast-medium">Posts</PText>
                </div>
                <PDivider direction="vertical" />
                <div className="text-center">
                  <PText weight="semi-bold">{followerCount}</PText>
                  <PText size="x-small" className="text-contrast-medium">Followers</PText>
                </div>
                <PDivider direction="vertical" />
                <div className="text-center">
                  <PText weight="semi-bold">{followingCount}</PText>
                  <PText size="x-small" className="text-contrast-medium">Following</PText>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-fluid-sm">
            {editingBio ? (
              <div className="flex flex-col gap-static-sm">
                <PTextarea
                  label="Bio"
                  name="bio"
                  value={bio}
                  onInput={(e) => setBio((e.target as HTMLTextAreaElement).value)}
                  placeholder="Tell people about yourself..."
                  rows={3}
                  resize="none"
                  maxLength={200}
                  counter
                />
                <div className="flex gap-static-sm justify-end">
                  <PButton variant="secondary" compact onClick={() => { setEditingBio(false); setBio(profile.bio); }}>
                    Cancel
                  </PButton>
                  <PButton compact loading={savingBio} onClick={handleSaveBio}>
                    Save
                  </PButton>
                </div>
              </div>
            ) : (
              profile.bio ? (
                <PText style={{ whiteSpace: 'pre-wrap' }}>{profile.bio}</PText>
              ) : (
                isOwnProfile ? (
                  <PText className="text-contrast-medium italic">No bio yet. Click "Edit Bio" to add one.</PText>
                ) : null
              )
            )}
          </div>

          {isFollowing && !isOwnProfile && (
            <div className="mt-fluid-sm">
              <PTag variant="info" icon="check" compact>Following</PTag>
            </div>
          )}
        </section>

        {/* Posts */}
        <div className="mb-fluid-sm">
          <h3 className="text-xl font-bold text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
            Posts
          </h3>
        </div>
        <PDivider className="mb-fluid-md" />

        {posts.length === 0 ? (
          <div className="text-center py-fluid-xl">
            <PText style={{ color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              {isOwnProfile ? "You haven't posted anything yet." : `${profile.username} hasn't posted yet.`}
            </PText>
          </div>
        ) : (
          <div className="flex flex-col gap-fluid-sm">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUpdate={fetchData}
                onProfileClick={(uid) => onNavigate('profile', uid)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
