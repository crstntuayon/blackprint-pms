"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import { Send, User, Shield, Loader2, Check, CheckCheck, Pencil, Trash2, X } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserRole: "admin" | "client";
}

export function ChatPanel({
  isOpen,
  onClose,
  currentUserId,
  otherUserId,
  otherUserName,
  otherUserRole,
}: ChatPanelProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    if (!otherUserId) return;
    try {
      const res = await fetch(`/api/messages?with=${otherUserId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            return data;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  };

  // Initial fetch + polling
  useEffect(() => {
    if (!isOpen || !otherUserId) return;
    setLoading(true);
    fetchMessages().finally(() => setLoading(false));

    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [isOpen, otherUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const doSend = async () => {
    if (!input.trim() || sending) return;
    if (!otherUserId) {
      toast({ variant: "destructive", title: "Error", description: "Recipient not found" });
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: otherUserId, content: input.trim() }),
      });

      if (res.ok) {
        setInput("");
        await fetchMessages();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({
          variant: "destructive",
          title: "Failed to send",
          description: data.details || data.error || `Server returned ${res.status}`,
        });
      }
    } catch (err) {
      console.error("Send message error:", err);
      toast({
        variant: "destructive",
        title: "Network error",
        description: "Could not send message. Check your connection.",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSend();
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditText(msg.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const doEdit = async (msgId: string) => {
    if (!editText.trim()) return;
    try {
      const res = await fetch(`/api/messages/${msgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText.trim() }),
      });
      if (res.ok) {
        setEditingId(null);
        setEditText("");
        await fetchMessages();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ variant: "destructive", title: "Failed to edit", description: data.error || "Could not edit message" });
      }
    } catch {
      toast({ variant: "destructive", title: "Network error", description: "Could not edit message." });
    }
  };

  const doDelete = async (msgId: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      const res = await fetch(`/api/messages/${msgId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchMessages();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ variant: "destructive", title: "Failed to delete", description: data.error || "Could not delete message" });
      }
    } catch {
      toast({ variant: "destructive", title: "Network error", description: "Could not delete message." });
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isEdited = (msg: Message) => msg.edited;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              {otherUserRole === "admin" ? (
                <Shield className="h-4 w-4 text-primary" />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
            </div>
            <div>
              <SheetTitle className="text-base">{otherUserName}</SheetTitle>
              <p className="text-xs text-muted-foreground capitalize">{otherUserRole}</p>
            </div>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {loading && messages.length === 0 && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {messages.length === 0 && !loading && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const isEditing = editingId === msg.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`group max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-none"
                      : "bg-muted rounded-bl-none"
                  }`}
                >
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="text-sm h-8 bg-white text-black"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            doEdit(msg.id);
                          }
                          if (e.key === "Escape") {
                            cancelEdit();
                          }
                        }}
                      />
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => doEdit(msg.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className={!isMe && !msg.read ? "font-bold" : ""}>{msg.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                        {isEdited(msg) && (
                          <span className="text-[9px] italic opacity-70">(edited)</span>
                        )}
                        {isMe && (
                          <span className="ml-0.5">
                            {msg.read ? (
                              <CheckCheck className="h-3 w-3" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                      {isMe && (
                        <div className="flex justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(msg)}
                            className="p-0.5 rounded hover:bg-primary-foreground/20"
                            title="Edit"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => doDelete(msg.id)}
                            className="p-0.5 rounded hover:bg-primary-foreground/20"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="px-4 py-3 border-t shrink-0 flex gap-2">
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                doSend();
              }
            }}
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !input.trim()} onClick={doSend}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
