"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChatPanel } from "@/components/chat-panel";
import { MessageCircle } from "lucide-react";

interface ChatButtonProps {
  currentUserId: string;
}

export function ChatButton({ currentUserId }: ChatButtonProps) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [admin, setAdmin] = useState<{ id: string; name: string | null; username: string } | null>(null);

  // Fetch admin info once
  useEffect(() => {
    fetch("/api/admin")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setAdmin(data);
      })
      .catch(() => {});
  }, []);

  // Poll unread count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/messages/unread");
        if (res.ok) {
          const data = await res.json();
          setUnread(data.count || 0);
        }
      } catch {
        // silently fail
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, open ? 10000 : 5000);
    return () => clearInterval(interval);
  }, [open]);

  if (!admin) return null;

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40 p-0"
        onClick={() => setOpen(true)}
      >
        <MessageCircle className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Button>

      <ChatPanel
        isOpen={open}
        onClose={() => setOpen(false)}
        currentUserId={currentUserId}
        otherUserId={admin.id}
        otherUserName={admin.name || admin.username}
        otherUserRole="admin"
      />
    </>
  );
}
