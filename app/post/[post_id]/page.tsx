'use client';

import { useParams } from 'next/navigation';
import PostCommentsPage from '@/components/PostCommentsPage';

export default function PostPage() {
  const params = useParams();
  const postId = params.post_id as string;

  return <PostCommentsPage postId={postId} />;
}
