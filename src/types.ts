export interface Profile {
  id: string;
  username: string;
  bio: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: Profile;
  likes: { id: string; user_id: string }[];
  comments: Comment[];
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: Profile;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
}
