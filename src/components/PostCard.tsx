import { useState } from 'react';
import {
  PText,
  PButton,
  PButtonPure,
  PDivider,
  PTag,
  PTextarea,
} from '@porsche-design-system/components-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { Post, Comment } from '../types';

interface Props {
  post: Post;
  onUpdate: () => void;
  onProfileClick: (userId: string) => void;
}

export default function PostCard({ post, onUpdate, onProfileClick }: Props) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);

  const isLiked = post.likes.some((l) => l.user_id === user?.id);
  const likeCount = post.likes.length;
  const commentCount = post.comments.length;
  const isOwner = post.user_id === user?.id;

  async function handleLikeToggle() {
    if (!user) return;
    try {
      await api.toggleLike(post.id);
      onUpdate();
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  }

  async function handleDeletePost() {
    setDeletingPost(true);
    try {
      await api.deletePost(post.id);
      onUpdate();
    } catch (err) {
      console.error('Failed to delete post:', err);
      setDeletingPost(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    setSubmittingComment(true);
    try {
      await api.addComment(post.id, newComment.trim());
      setNewComment('');
      onUpdate();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    try {
      await api.deleteComment(commentId);
      onUpdate();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  }

  function formatTime(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  }

  return (
    <article className="bg-surface rounded-lg p-fluid-md" style={{ boxShadow: '0px 3px 8px rgba(0,0,0,.08)' }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-static-sm mb-fluid-sm">
        <button
          onClick={() => onProfileClick(post.user_id)}
          className="flex items-center gap-static-sm bg-transparent border-none cursor-pointer p-0 text-left"
        >
          <div
            className="flex items-center justify-center rounded-full bg-canvas border border-contrast-low text-primary font-bold shrink-0"
            style={{ width: 40, height: 40, fontSize: 16 }}
          >
            {post.profiles.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <PText weight="semi-bold" className="hover:underline">{post.profiles.username}</PText>
            <PText size="x-small" className="text-contrast-medium">{formatTime(post.created_at)}</PText>
          </div>
        </button>
        {isOwner && (
          <PButtonPure
            icon="delete"
            hideLabel
            aria={{ 'aria-label': 'Delete post' }}
            onClick={handleDeletePost}
            loading={deletingPost}
            size="small"
          />
        )}
      </div>

      {/* Content */}
      <PText className="mb-fluid-sm" style={{ whiteSpace: 'pre-wrap' }}>{post.content}</PText>

      <PDivider />

      {/* Actions */}
      <div className="flex items-center gap-fluid-sm mt-fluid-sm">
        <PButtonPure
          icon="heart"
          onClick={handleLikeToggle}
          aria={{ 'aria-label': isLiked ? 'Unlike' : 'Like' }}
        >
          <span className="flex items-center gap-static-xs">
            {isLiked ? (
              <PTag variant="error" compact icon="heart">{likeCount}</PTag>
            ) : (
              <>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</>
            )}
          </span>
        </PButtonPure>

        <PButtonPure
          icon="chat"
          onClick={() => setShowComments(!showComments)}
          aria={{ 'aria-label': 'Toggle comments' }}
        >
          {commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}
        </PButtonPure>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-fluid-sm">
          <PDivider />
          <div className="mt-fluid-sm flex flex-col gap-fluid-xs">
            {post.comments.length === 0 && (
              <PText size="small" className="text-contrast-medium italic">No comments yet. Be the first!</PText>
            )}
            {post.comments.map((comment: Comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={user?.id ?? ''}
                onDelete={handleDeleteComment}
                onProfileClick={onProfileClick}
                formatTime={formatTime}
              />
            ))}
          </div>

          <form onSubmit={handleAddComment} className="mt-fluid-sm flex flex-col gap-static-sm">
            <PTextarea
              label="Add a comment"
              hideLabel
              name="comment"
              value={newComment}
              onInput={(e) => setNewComment((e.target as HTMLTextAreaElement).value)}
              placeholder="Write a comment..."
              rows={2}
              resize="none"
              maxLength={500}
            />
            <div className="flex justify-end">
              <PButton type="submit" loading={submittingComment} compact variant="secondary">
                Comment
              </PButton>
            </div>
          </form>
        </div>
      )}
    </article>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onDelete,
  onProfileClick,
  formatTime,
}: {
  comment: Comment;
  currentUserId: string;
  onDelete: (id: string) => void;
  onProfileClick: (userId: string) => void;
  formatTime: (ts: string) => string;
}) {
  const isOwner = comment.user_id === currentUserId;

  return (
    <div className="bg-canvas rounded p-static-sm flex items-start gap-static-sm">
      <button
        onClick={() => onProfileClick(comment.user_id)}
        className="flex items-center justify-center rounded-full bg-surface border border-contrast-low text-primary font-bold shrink-0 bg-transparent border-none cursor-pointer p-0"
        style={{ width: 32, height: 32, fontSize: 13, background: 'var(--p-color-bg-surface)' }}
      >
        {comment.profiles.username.charAt(0).toUpperCase()}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-static-xs">
          <button
            onClick={() => onProfileClick(comment.user_id)}
            className="bg-transparent border-none cursor-pointer p-0"
          >
            <PText size="x-small" weight="semi-bold">{comment.profiles.username}</PText>
          </button>
          <PText size="xx-small" className="text-contrast-medium">{formatTime(comment.created_at)}</PText>
        </div>
        <PText size="small" style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</PText>
      </div>
      {isOwner && (
        <PButtonPure
          icon="delete"
          hideLabel
          size="x-small"
          aria={{ 'aria-label': 'Delete comment' }}
          onClick={() => onDelete(comment.id)}
        />
      )}
    </div>
  );
}
