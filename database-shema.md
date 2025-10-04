# Database Schema - Vocal Social App

## Table Structure

### 1. `profiles` Table
```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_profile_complete BOOLEAN DEFAULT FALSE
);
```

**TypeScript Interface:**
```typescript
interface Profile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  is_profile_complete: boolean;
}
```

### 2. `posts` Table
```sql
CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  audio_url TEXT NOT NULL,
  duration INTEGER NOT NULL,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**TypeScript Interface:**
```typescript
interface Post {
  id: string;
  user_id: string;
  audio_url: string;
  duration: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profiles?: Profile; // Joined profile data
  post_tags?: PostTag[]; // Joined tag data
}
```

### 3. `tags` Table
```sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL
);
```

**TypeScript Interface:**
```typescript
interface Tag {
  id: number;
  name: string;
  emoji: string;
  color: string;
}
```

### 4. `post_tags` Table (Junction Table)
```sql
CREATE TABLE post_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(post_id, tag_id)
);
```

**TypeScript Interface:**
```typescript
interface PostTag {
  id: string;
  post_id: string;
  tag_id: number;
  tags: Tag; // Joined tag data
}
```

## Table Relationships

### Posts ’ Profiles (Many-to-One)
- `posts.user_id` ’ `profiles.id`
- Each post belongs to one profile
- One profile can have many posts

### Posts ’ Tags (Many-to-Many via post_tags)
- `posts.id` ” `post_tags.post_id`
- `tags.id` ” `post_tags.tag_id`
- Each post can have multiple tags
- Each tag can be used by multiple posts

## Supabase Query Examples

### Get Posts with Profile and Tags
```typescript
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    profiles (id, username, email, avatar_url, bio, created_at),
    post_tags (
      id,
      post_id,
      tag_id,
      tags (id, name, emoji, color)
    )
  `)
  .order('created_at', { ascending: false });
```

### Get User Profile
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();
```

### Get User's Posts
```typescript
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

## Storage

### Audio Files Bucket
- **Bucket Name:** `audio-files`
- **Public Access:** Yes
- **File Types:** `audio/*`
- **Max Size:** 50MB
- **Path Structure:** `{user_id}/vocal-{timestamp}.{ext}`

## Row Level Security (RLS) Policies

### Profiles Table
-  Public read access (for user info display)
-  Users can insert their own profile
-  Users can update their own profile

### Posts Table
-  Public read access (feed without auth)
-  Authenticated users can insert posts
-  Users can update/delete their own posts

### Tags Table
-  Public read access
- L No insert/update (managed by admin)

### Post Tags Table
-  Public read access
-  Post owners can manage their post tags

### Storage Policies
-  Public read access to audio files
-  Authenticated users can upload
-  Users can manage their own files

## Key Design Decisions

1. **Profiles vs Users:** Using `profiles` table instead of `users` for extended user data
2. **Public Feed:** Posts are publicly readable for unauthenticated users
3. **Audio Storage:** Centralized in Supabase Storage with public access
4. **Tag System:** Flexible many-to-many relationship for content categorization
5. **RLS Security:** Granular permissions while maintaining public feed access