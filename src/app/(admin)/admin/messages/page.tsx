"use client";

import { useState, useEffect } from "react";
import { ChatPanel } from "@/components/chat-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Search, User, Loader2 } from "lucide-react";

interface Conversation {
  userId: string;
  name: string;
  username: string;
  role: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function AdminMessagesPage() {
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Conversation | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to load conversations" });
    }
  };

  // Get current user ID from session
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.id) setCurrentUserId(data.user.id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchConversations().finally(() => setLoading(false));

    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  const openChat = (conv: Conversation) => {
    setSelectedUser(conv);
    setChatOpen(true);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">Chat with your clients</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && conversations.length === 0 && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No conversations yet</p>
          <p className="text-sm">Clients will appear here when they message you.</p>
        </div>
      )}

      <div className="grid gap-3">
        {filtered.map((conv) => (
          <Card
            key={conv.userId}
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => openChat(conv)}
          >
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{conv.name}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDate(conv.lastMessageAt)}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="h-5 min-w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1.5 shrink-0">
                  {conv.unreadCount}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedUser && currentUserId && (
        <ChatPanel
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          currentUserId={currentUserId}
          otherUserId={selectedUser.userId}
          otherUserName={selectedUser.name}
          otherUserRole="client"
        />
      )}
    </div>
  );
}
