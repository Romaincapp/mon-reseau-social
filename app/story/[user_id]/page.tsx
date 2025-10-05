'use client';

import { use } from 'react';
import StoryViewer from '@/components/StoryViewer';

export default function StoryPage({ params }: { params: Promise<{ user_id: string }> }) {
  const { user_id } = use(params);

  return <StoryViewer userId={user_id} />;
}
