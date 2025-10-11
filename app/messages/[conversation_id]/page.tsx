'use client';

import { useParams } from 'next/navigation';
import MessagingInterface from '@/components/MessagingInterface';

export default function ConversationPage() {
  const params = useParams();
  const conversationId = params.conversation_id as string;

  return <MessagingInterface conversationId={conversationId} />;
}
