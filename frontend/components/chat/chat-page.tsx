'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store';
import {
  useChatContacts,
  useChatMessages,
  useSendMessage,
  useMarkMessagesRead,
  useChatUnreadCount,
  chatKeys,
} from '@/hooks/queries/use-chat';
import {
  connectToChat,
  disconnectFromChat,
  joinChatRoom,
  leaveChatRoom,
  sendTypingIndicator,
} from '@/lib/signalr/connection';
import { ChatMessage, ChatConversation } from '@/types';

export default function ChatPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevSelectedRef = useRef<string | null>(null);

  // Use fast contacts endpoint for sidebar (no message history fetched)
  const { data: contacts, isLoading: contactsLoading } = useChatContacts();
  // Messages only load when a conversation is selected
  const { data: messages, isLoading: messagesLoading } = useChatMessages(selectedUserId || '');
  const sendMessageMutation = useSendMessage();
  const markReadMutation = useMarkMessagesRead();
  const { data: unreadData } = useChatUnreadCount();

  // Connect to SignalR Chat Hub once on mount.
  // ReceiveMessage is the ONLY way the receiver gets new messages in real-time.
  // The sender gets the message from the REST response (useSendMessage.onSuccess).
  useEffect(() => {
    if (!user) return;

    connectToChat({
      onReceiveMessage: (message: ChatMessage) => {
        // Add to the conversation cache if we have it open
        queryClient.setQueryData<ChatMessage[]>(
          chatKeys.conversation(message.senderId),
          (old) => {
            if (!old) return undefined; // Don't create cache if conversation isn't open
            if (old.some((m) => m.id === message.id)) return old; // Deduplicate
            return [message, ...old];
          }
        );
        // Update contact list last message + unread count
        queryClient.setQueryData<ChatConversation[]>(
          chatKeys.contacts(),
          (old) => {
            if (!old) return old;
            return old.map((c) =>
              c.userId === message.senderId
                ? {
                    ...c,
                    lastMessage: message.content,
                    lastMessageAt: message.createdAt,
                    unreadCount: c.unreadCount + 1,
                  }
                : c
            );
          }
        );
        queryClient.invalidateQueries({ queryKey: chatKeys.unreadCount() });
      },
      onUserTyping: (data: { userId: string }) => {
        setIsTyping(data.userId);
        setTimeout(() => setIsTyping(null), 3000);
      },
      onMessagesRead: () => {
        if (selectedUserId) {
          queryClient.invalidateQueries({ queryKey: chatKeys.conversation(selectedUserId) });
        }
      },
      onMessageError: (data: { error: string }) => {
        console.error('Message error:', data.error);
      },
    });

    return () => {
      disconnectFromChat();
    };
    // Only run on mount/unmount — user identity doesn't change mid-session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Room management: join when selecting a conversation, leave the previous one
  useEffect(() => {
    const prev = prevSelectedRef.current;
    if (prev && prev !== selectedUserId) {
      leaveChatRoom(prev);
    }
    if (selectedUserId) {
      joinChatRoom(selectedUserId);
      prevSelectedRef.current = selectedUserId;
    }
  }, [selectedUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (selectedUserId) {
      markReadMutation.mutate(selectedUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !selectedUserId) return;

    const content = messageInput.trim();
    setMessageInput('');

    // Always use REST API to send. The backend pushes ReceiveMessage to the
    // receiver via SignalR. The sender gets the saved message from this REST response.
    sendMessageMutation.mutate({ receiverId: selectedUserId, content });
  }, [messageInput, selectedUserId, sendMessageMutation]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (!selectedUserId) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    sendTypingIndicator(selectedUserId);

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = null;
    }, 2000);
  };

  const selectedConversation = contacts?.find(
    (c: ChatConversation) => c.userId === selectedUserId
  );

  const filteredContacts = contacts?.filter((c: ChatConversation) =>
    c.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reverse messages so oldest are first (API returns descending)
  const sortedMessages = messages ? [...messages].reverse() : [];

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl border bg-background shadow-sm overflow-hidden">
      {/* Contacts Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            💬 Messages
            {unreadData && unreadData.count > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                {unreadData.count}
              </span>
            )}
          </h2>
          <div className="mt-3 relative">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Contacts List */}
        <div className="flex-1 overflow-y-auto">
          {contactsLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="h-2 bg-muted rounded w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredContacts && filteredContacts.length > 0 ? (
            filteredContacts.map((conv: ChatConversation) => (
              <button
                key={conv.userId}
                onClick={() => setSelectedUserId(conv.userId)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors border-b ${
                  selectedUserId === conv.userId
                    ? 'bg-primary/5 border-l-2 border-l-primary'
                    : ''
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                  {conv.userName
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{conv.userName}</p>
                    {conv.lastMessageAt && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatMessageTime(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-2">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 capitalize">
                    {conv.userRole}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <span className="text-3xl block mb-2">💬</span>
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">
                Your assigned doctors/secretaries will appear here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUserId && selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b flex items-center px-6 bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  {selectedConversation.userName
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {selectedConversation.userName}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {isTyping === selectedUserId
                      ? 'Typing...'
                      : selectedConversation.userRole}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messagesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`animate-pulse flex ${
                        i % 2 === 0 ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`h-10 rounded-2xl bg-muted ${
                          i % 2 === 0 ? 'w-48' : 'w-56'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              ) : sortedMessages.length > 0 ? (
                sortedMessages.map((msg: ChatMessage) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                          isMine
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap wrap-break-word">
                          {msg.content}
                        </p>
                        <div
                          className={`flex items-center gap-1 mt-1 ${
                            isMine ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <span
                            className={`text-[10px] ${
                              isMine
                                ? 'text-primary-foreground/60'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {formatMessageTime(msg.createdAt)}
                          </span>
                          {isMine && (
                            <span
                              className={`text-[10px] ${
                                msg.isRead
                                  ? 'text-primary-foreground/80'
                                  : 'text-primary-foreground/40'
                              }`}
                            >
                              {msg.isRead ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex-1 flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <span className="text-4xl block mb-2">👋</span>
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">
                      Send a message to start the conversation
                    </p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {isTyping === selectedUserId && (
              <div className="px-6 py-1">
                <span className="text-xs text-muted-foreground italic">
                  {selectedConversation.userName} is typing...
                </span>
              </div>
            )}

            {/* Message Input */}
            <div className="border-t p-4">
              <div className="flex items-end gap-2">
                <textarea
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 px-4 py-2.5 text-sm border rounded-xl bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none max-h-32 overflow-y-auto"
                  style={{
                    height: 'auto',
                    minHeight: '42px',
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sendMessageMutation.isPending}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shrink-0"
                >
                  {sendMessageMutation.isPending ? '...' : 'Send'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <span className="text-5xl block mb-3">💬</span>
              <h3 className="text-lg font-medium mb-1">Select a conversation</h3>
              <p className="text-sm">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
