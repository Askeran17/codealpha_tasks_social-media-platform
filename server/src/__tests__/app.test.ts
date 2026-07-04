import { beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { initDb } from '../db.js';

beforeAll(async () => {
  await initDb();
});

async function registerUser(username: string, email: string, password = 'password123') {
  const res = await request(app).post('/api/auth/register').send({ username, email, password });
  return res.body;
}

describe('POST /api/auth/register', () => {
  it('registers a new user and returns a session token', async () => {
    const body = await registerUser('alice', 'alice@example.com');
    expect(body.error).toBeUndefined();
    expect(body.session.access_token).toEqual(expect.any(String));
    expect(body.profile.username).toBe('alice');
  });

  it('rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'bob' });
    expect(res.body.error).toBe('Missing required fields');
  });

  it('rejects a short username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', email: 'ab@example.com', password: 'password123' });
    expect(res.body.error).toBe('Username must be at least 3 characters');
  });

  it('rejects a short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'shortpw', email: 'shortpw@example.com', password: '123' });
    expect(res.body.error).toBe('Password must be at least 6 characters');
  });

  it('rejects a duplicate username', async () => {
    await registerUser('duplicate', 'first@example.com');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'duplicate', email: 'second@example.com', password: 'password123' });
    expect(res.body.error).toBe('Username is already taken');
  });

  it('rejects a duplicate email', async () => {
    await registerUser('emailowner', 'shared@example.com');
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'otherusername', email: 'shared@example.com', password: 'password123' });
    expect(res.body.error).toBe('Email is already registered');
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await registerUser('loginuser', 'login@example.com', 'correcthorse');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'correcthorse' });
    expect(res.body.error).toBeUndefined();
    expect(res.body.session.access_token).toEqual(expect.any(String));
  });

  it('rejects an incorrect password', async () => {
    await registerUser('wrongpw', 'wrongpw@example.com', 'correcthorse');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrongpw@example.com', password: 'wrongpassword' });
    expect(res.body.error).toBe('Invalid email or password');
  });

  it('rejects an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever1' });
    expect(res.body.error).toBe('Invalid email or password');
  });
});

describe('GET /api/auth/me', () => {
  it('rejects requests without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user profile with a valid token', async () => {
    const { session } = await registerUser('meuser', 'meuser@example.com');
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${session.access_token}`);
    expect(res.status).toBe(200);
    expect(res.body.profile.username).toBe('meuser');
  });
});

describe('Posts, likes and comments', () => {
  async function createAuthedUser(username: string, email: string) {
    const { session } = await registerUser(username, email);
    return session.access_token as string;
  }

  it('creates a post and rejects empty content', async () => {
    const token = await createAuthedUser('poster', 'poster@example.com');

    const empty = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '   ' });
    expect(empty.status).toBe(400);

    const created = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Hello world' });
    expect(created.status).toBe(200);
    expect(created.body.content).toBe('Hello world');
  });

  it('lists posts in the explore feed', async () => {
    const token = await createAuthedUser('explorer', 'explorer@example.com');
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Explore me' });

    const res = await request(app)
      .get('/api/posts?type=explore')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((p: any) => p.content === 'Explore me')).toBe(true);
  });

  it('only shows followed users posts in the personal feed', async () => {
    const followerToken = await createAuthedUser('follower1', 'follower1@example.com');
    const followeeToken = await createAuthedUser('followee1', 'followee1@example.com');

    const followeeMe = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${followeeToken}`);
    const followeeId = followeeMe.body.profile.id;

    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${followeeToken}`)
      .send({ content: 'Only for followers' });

    const feedBeforeFollow = await request(app)
      .get('/api/posts?type=feed')
      .set('Authorization', `Bearer ${followerToken}`);
    expect(feedBeforeFollow.body.some((p: any) => p.content === 'Only for followers')).toBe(false);

    await request(app)
      .post(`/api/profiles/${followeeId}/follow`)
      .set('Authorization', `Bearer ${followerToken}`);

    const feedAfterFollow = await request(app)
      .get('/api/posts?type=feed')
      .set('Authorization', `Bearer ${followerToken}`);
    expect(feedAfterFollow.body.some((p: any) => p.content === 'Only for followers')).toBe(true);
  });

  it('toggles a like on a post', async () => {
    const token = await createAuthedUser('liker', 'liker@example.com');
    const post = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Like me' });

    const like = await request(app)
      .post(`/api/posts/${post.body.id}/like`)
      .set('Authorization', `Bearer ${token}`);
    expect(like.body.liked).toBe(true);

    const unlike = await request(app)
      .post(`/api/posts/${post.body.id}/like`)
      .set('Authorization', `Bearer ${token}`);
    expect(unlike.body.liked).toBe(false);
  });

  it('adds and deletes a comment', async () => {
    const token = await createAuthedUser('commenter', 'commenter@example.com');
    const post = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Comment on me' });

    const emptyComment = await request(app)
      .post(`/api/posts/${post.body.id}/comment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: '' });
    expect(emptyComment.status).toBe(400);

    const comment = await request(app)
      .post(`/api/posts/${post.body.id}/comment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Nice post!' });
    expect(comment.status).toBe(200);

    const deleted = await request(app)
      .delete(`/api/comments/${comment.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleted.body.success).toBe(true);
  });

  it('prevents deleting a post owned by someone else', async () => {
    const ownerToken = await createAuthedUser('owner', 'owner@example.com');
    const otherToken = await createAuthedUser('other', 'other@example.com');

    const post = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ content: 'Mine only' });

    const res = await request(app)
      .delete(`/api/posts/${post.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Follow system', () => {
  it('prevents following yourself', async () => {
    const { session, profile } = await registerUser('selffollower', 'selffollower@example.com');
    const res = await request(app)
      .post(`/api/profiles/${profile.id}/follow`)
      .set('Authorization', `Bearer ${session.access_token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('You cannot follow yourself');
  });
});

describe('GET /api/profiles/:id', () => {
  it('returns 404 for an unknown profile', async () => {
    const res = await request(app).get('/api/profiles/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('returns follower and following counts', async () => {
    const { profile } = await registerUser('profileowner', 'profileowner@example.com');
    const res = await request(app).get(`/api/profiles/${profile.id}`);
    expect(res.status).toBe(200);
    expect(res.body.followerCount).toBe(0);
    expect(res.body.followingCount).toBe(0);
  });
});
