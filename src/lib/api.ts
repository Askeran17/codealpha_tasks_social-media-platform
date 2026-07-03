const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5001/api'
  : '/api';

async function request(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  async login(email: string, password: string) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.error) {
      throw new Error(data.error);
    }
    if (data.session?.access_token) {
      localStorage.setItem('token', data.session.access_token);
    }
    return data;
  },

  async register(username: string, email: string, password: string) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    if (data.error) {
      throw new Error(data.error);
    }
    if (data.session?.access_token) {
      localStorage.setItem('token', data.session.access_token);
    }
    return data;
  },

  async logout() {
    localStorage.removeItem('token');
  },

  async getCurrentUser() {
    return request('/auth/me');
  },

  async getProfile(userId: string) {
    return request(`/profiles/${userId}`);
  },

  async updateBio(bio: string) {
    return request('/profiles/bio', {
      method: 'PUT',
      body: JSON.stringify({ bio }),
    });
  },

  async toggleFollow(userId: string) {
    return request(`/profiles/${userId}/follow`, {
      method: 'POST',
    });
  },

  async getPosts(type: 'feed' | 'explore' = 'explore') {
    return request(`/posts?type=${type}`);
  },

  async createPost(content: string) {
    return request('/posts', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async deletePost(id: string) {
    return request(`/posts/${id}`, {
      method: 'DELETE',
    });
  },

  async toggleLike(postId: string) {
    return request(`/posts/${postId}/like`, {
      method: 'POST',
    });
  },

  async addComment(postId: string, content: string) {
    return request(`/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async deleteComment(commentId: string) {
    return request(`/comments/${commentId}`, {
      method: 'DELETE',
    });
  },
};
