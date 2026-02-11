'use client';

import ChatPage from '@/components/chat/chat-page';

export default function DoctorMessagesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Communicate with your secretaries
        </p>
      </div>
      <ChatPage />
    </div>
  );
}
