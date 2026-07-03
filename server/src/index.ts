import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { initDb, getDb } from './db.js';
import { authenticateToken, type AuthenticatedRequest } from './middleware/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET: string = (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is missing in server configuration');
  }
  return secret;
})();

app.use(cors());
app.use(express.json());

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  const { email, password, username } = req.body;
  if (!email || !password || !username) {
    return res.status(200).json({ error: 'Missing required fields' });
  }
  if (username.length < 3) {
    return res.status(200).json({ error: 'Username must be at least 3 characters' });
  }
  if (password.length < 6) {
    return res.status(200).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDb();
  try {
    // Check existing username
    const existingUsername = await db.get('SELECT id FROM users WHERE username = ?', username);
    if (existingUsername) {
      return res.status(200).json({ error: 'Username is already taken' });
    }

    // Check existing email
    const existingEmail = await db.get('SELECT id FROM users WHERE email = ?', email);
    if (existingEmail) {
      return res.status(200).json({ error: 'Email is already registered' });
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    await db.run(
      'INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)',
      [userId, username, email, passwordHash]
    );

    // Fetch newly created user profile
    const userProfile = await db.get('SELECT id, username, bio, created_at FROM users WHERE id = ?', userId);

    const token = jwt.sign({ id: userId, email, username }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      session: {
        access_token: token,
        expires_in: 604800,
        token_type: 'bearer',
        user: {
          id: userId,
          email,
          user_metadata: { username },
        },
      },
      profile: userProfile,
    });
  } catch (err: any) {
    return res.status(200).json({ error: err.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(200).json({ error: 'Missing email or password' });
  }

  const db = getDb();
  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (!user) {
      return res.status(200).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(200).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      session: {
        access_token: token,
        expires_in: 604800,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          user_metadata: { username: user.username },
        },
      },
      profile: {
        id: user.id,
        username: user.username,
        bio: user.bio,
        created_at: user.created_at,
      },
    });
  } catch (err: any) {
    return res.status(200).json({ error: err.message || 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDb();
  try {
    const user = await db.get('SELECT id, username, email, bio, created_at FROM users WHERE id = ?', req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { username: user.username },
      },
      profile: {
        id: user.id,
        username: user.username,
        bio: user.bio,
        created_at: user.created_at,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Profile Routes
app.get('/api/profiles/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDb();

  // Retrieve current user token optionally (to verify follow status)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  let currentUserId: string | null = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      currentUserId = decoded.id;
    } catch (e) {
      // Ignore invalid token on public profile view
    }
  }

  try {
    const profile = await db.get('SELECT id, username, bio, created_at FROM users WHERE id = ?', id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const followersCountRes = await db.get('SELECT count(*) as count FROM follows WHERE following_id = ?', id);
    const followingCountRes = await db.get('SELECT count(*) as count FROM follows WHERE follower_id = ?', id);

    let isFollowing = false;
    if (currentUserId) {
      const followRelation = await db.get(
        'SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?',
        [currentUserId, id]
      );
      isFollowing = !!followRelation;
    }

    // Fetch user's posts with details (likes, comments, profiles)
    const posts = await db.all('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC', id);
    const postsWithDetails = [];
    for (const post of posts) {
      const postProfile = await db.get('SELECT id, username, bio, created_at FROM users WHERE id = ?', post.user_id);
      const likes = await db.all('SELECT id, user_id FROM likes WHERE post_id = ?', post.id);
      const comments = await db.all(
        'SELECT id, post_id, user_id, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC',
        post.id
      );

      const commentsWithProfiles = [];
      for (const comment of comments) {
        const commentProfile = await db.get(
          'SELECT id, username, bio, created_at FROM users WHERE id = ?',
          comment.user_id
        );
        commentsWithProfiles.push({
          id: comment.id,
          post_id: comment.post_id,
          user_id: comment.user_id,
          content: comment.content,
          created_at: comment.created_at,
          profiles: commentProfile,
        });
      }

      postsWithDetails.push({
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        created_at: post.created_at,
        profiles: postProfile,
        likes: likes.map((l) => ({ id: l.id, user_id: l.user_id })),
        comments: commentsWithProfiles,
      });
    }

    return res.json({
      profile,
      followerCount: followersCountRes?.count || 0,
      followingCount: followingCountRes?.count || 0,
      isFollowing,
      posts: postsWithDetails,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.put('/api/profiles/bio', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { bio } = req.body;

  const db = getDb();
  try {
    await db.run('UPDATE users SET bio = ? WHERE id = ?', [bio ?? '', req.user.id]);
    const profile = await db.get('SELECT id, username, bio, created_at FROM users WHERE id = ?', req.user.id);
    return res.json({ profile });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/profiles/:id/follow', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const followingId = req.params.id;
  const followerId = req.user.id;

  if (followerId === followingId) {
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }

  const db = getDb();
  try {
    const existing = await db.get(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, followingId]
    );

    if (existing) {
      await db.run('DELETE FROM follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId]);
      return res.json({ following: false });
    } else {
      const id = uuidv4();
      await db.run(
        'INSERT INTO follows (id, follower_id, following_id) VALUES (?, ?, ?)',
        [id, followerId, followingId]
      );
      return res.json({ following: true });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Posts Routes
app.get('/api/posts', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const type = req.query.type || 'explore'; // 'feed' or 'explore'

  const db = getDb();
  try {
    let posts = [];

    if (type === 'feed') {
      // Find following IDs
      const follows = await db.all('SELECT following_id FROM follows WHERE follower_id = ?', req.user.id);
      const followingIds = follows.map((f) => f.following_id);
      followingIds.push(req.user.id); // include own posts

      // Construct parameterized query for IN list
      const placeholders = followingIds.map(() => '?').join(',');
      posts = await db.all(
        `SELECT * FROM posts WHERE user_id IN (${placeholders}) ORDER BY created_at DESC LIMIT 50`,
        followingIds
      );
    } else {
      posts = await db.all('SELECT * FROM posts ORDER BY created_at DESC LIMIT 50');
    }

    const postsWithDetails = [];
    for (const post of posts) {
      const profile = await db.get('SELECT id, username, bio, created_at FROM users WHERE id = ?', post.user_id);
      const likes = await db.all('SELECT id, user_id FROM likes WHERE post_id = ?', post.id);
      const comments = await db.all(
        'SELECT id, post_id, user_id, content, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC',
        post.id
      );

      const commentsWithProfiles = [];
      for (const comment of comments) {
        const commentProfile = await db.get(
          'SELECT id, username, bio, created_at FROM users WHERE id = ?',
          comment.user_id
        );
        commentsWithProfiles.push({
          id: comment.id,
          post_id: comment.post_id,
          user_id: comment.user_id,
          content: comment.content,
          created_at: comment.created_at,
          profiles: commentProfile,
        });
      }

      postsWithDetails.push({
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        created_at: post.created_at,
        profiles: profile,
        likes: likes.map((l) => ({ id: l.id, user_id: l.user_id })),
        comments: commentsWithProfiles,
      });
    }

    return res.json(postsWithDetails);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Post content cannot be empty' });
  }

  const db = getDb();
  try {
    const postId = uuidv4();
    await db.run(
      'INSERT INTO posts (id, user_id, content) VALUES (?, ?, ?)',
      [postId, req.user.id, content.trim()]
    );
    const post = await db.get('SELECT * FROM posts WHERE id = ?', postId);
    return res.json(post);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const postId = req.params.id;

  const db = getDb();
  try {
    const result = await db.run(
      'DELETE FROM posts WHERE id = ? AND user_id = ?',
      [postId, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(403).json({ error: 'Unauthorized to delete this post or post not found' });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Likes Routes
app.post('/api/posts/:id/like', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const postId = req.params.id;
  const userId = req.user.id;

  const db = getDb();
  try {
    const existingLike = await db.get(
      'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );

    if (existingLike) {
      await db.run('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
      return res.json({ liked: false });
    } else {
      const id = uuidv4();
      await db.run(
        'INSERT INTO likes (id, post_id, user_id) VALUES (?, ?, ?)',
        [id, postId, userId]
      );
      return res.json({ liked: true });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Comments Routes
app.post('/api/posts/:id/comment', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const postId = req.params.id;
  const userId = req.user.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty' });
  }

  const db = getDb();
  try {
    const commentId = uuidv4();
    await db.run(
      'INSERT INTO comments (id, post_id, user_id, content) VALUES (?, ?, ?, ?)',
      [commentId, postId, userId, content.trim()]
    );
    const comment = await db.get('SELECT * FROM comments WHERE id = ?', commentId);
    return res.json(comment);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/comments/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const commentId = req.params.id;

  const db = getDb();
  try {
    const result = await db.run(
      'DELETE FROM comments WHERE id = ? AND user_id = ?',
      [commentId, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment or comment not found' });
    }

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
