'use client';

import { ChatBot } from '@/components/chat';

/**
 * Public chatbot widget for the landing page.
 * Uses the general medical assistant (user mode).
 */
export function PublicChatBot() {
  return <ChatBot mode="user" />;
}
