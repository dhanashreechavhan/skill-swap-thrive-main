import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Message {
  _id: string;
  sender: { _id: string; name: string; email: string };
  receiver: { _id: string; name: string; email: string };
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  userId: string;
  name: string;
  email: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const token = localStorage.getItem("token");
  const API = "http://localhost:5000";
  //  Auto-open conversation if coming from Message button
useEffect(() => {
  if (location.state?.recipientId) {
    setSelectedUserId(location.state.recipientId);
  }
}, [location.state]);

  // Fetch all messages and build conversation list
  const fetchMessages = async () => {
    try {
     const res = await fetch(`${API}/api/messages`, { 
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMessages(data);

      // Build conversations list from messages
      const convMap = new Map<string, Conversation>();
      data.forEach((msg: Message) => {
        const isMe = msg.sender._id === user?._id;
        const other = isMe ? msg.receiver : msg.sender;
        if (!convMap.has(other._id)) {
          convMap.set(other._id, {
            userId: other._id,
            name: other.name,
            email: other.email,
            lastMessage: msg.content,
            lastTime: msg.createdAt,
            unread: !isMe && !msg.isRead ? 1 : 0,
          });
        } else {
          const existing = convMap.get(other._id)!;
          if (!isMe && !msg.isRead) existing.unread += 1;
        }
      });
      setConversations(Array.from(convMap.values()));
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchMessages();
    // Poll every 5 seconds for new messages
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when chat opens or new message arrives
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedUserId, messages]);

  // Mark messages as read when opening a conversation
  const openConversation = async (userId: string) => {
    setSelectedUserId(userId);
    const unreadMsgs = messages.filter(
      (m) => m.sender._id === userId && !m.isRead
    );
    for (const msg of unreadMsgs) {
     await fetch(`${API}/api/messages/${msg._id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    fetchMessages();
  };

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId) return;
    setSending(true);
    try {
     const res = await fetch(`${API}/api/messages`, {
  method: "POST", 
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver: selectedUserId,
          content: newMessage.trim(),
        }),
      });
      setNewMessage("");
      fetchMessages();
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  // Get messages for selected conversation
  const chatMessages = messages.filter(
    (m) =>
      (m.sender._id === user?._id && m.receiver._id === selectedUserId) ||
      (m.receiver._id === user?._id && m.sender._id === selectedUserId)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const selectedUser = conversations.find((c) => c.userId === selectedUserId);
  const filteredConvs = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isLoggedIn={true} />

      <div className="flex-1 container py-6">
        <div className="flex h-[75vh] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* LEFT SIDE — Conversation list */}
          <div className="w-80 border-r border-slate-100 flex flex-col flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 mb-3">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search conversations..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 text-sm"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-600" />
                </div>
              ) : filteredConvs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-4">
                  <MessageSquare className="w-10 h-10 text-slate-300" />
                  <p className="text-sm text-slate-500">No conversations yet</p>
                  <p className="text-xs text-slate-400">Match with someone and start chatting!</p>
                </div>
              ) : (
                filteredConvs.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => openConversation(conv.userId)}
                    className={cn(
                      "w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-50",
                      selectedUserId === conv.userId && "bg-violet-50 border-l-2 border-l-violet-600"
                    )}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">
                        {conv.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-sm text-slate-800 truncate">{conv.name}</p>
                        <span className="text-xs text-slate-400 flex-shrink-0 ml-1">
                          {timeAgo(conv.lastTime)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-0.5">
                        <p className="text-xs text-slate-500 truncate">{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                          <span className="ml-1 flex-shrink-0 w-5 h-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* RIGHT SIDE — Chat window */}
          <div className="flex-1 flex flex-col">
            {!selectedUserId ? (
              // No conversation selected
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">Select a conversation</h3>
                <p className="text-sm text-slate-400 max-w-xs">
                  Choose someone from the left to start chatting with your skill exchange partner!
                </p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {selectedUser?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{selectedUser?.name}</p>
                    <p className="text-xs text-slate-400">{selectedUser?.email}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <p className="text-sm text-slate-400">No messages yet!</p>
                      <p className="text-xs text-slate-300">Say hello 👋</p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.sender._id === user?._id;
                      return (
                        <div key={msg._id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
                            isMe
                              ? "bg-violet-600 text-white rounded-br-sm"
                              : "bg-slate-100 text-slate-800 rounded-bl-sm"
                          )}>
                            <p className="leading-relaxed">{msg.content}</p>
                            <p className={cn("text-xs mt-1", isMe ? "text-violet-200" : "text-slate-400")}>
                              {timeAgo(msg.createdAt)}
                              {isMe && (
                                <span className="ml-1">{msg.isRead ? " ✓✓" : " ✓"}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Message input */}
                <div className="p-4 border-t border-slate-100">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      className="flex-1 bg-slate-50 border-slate-200 focus-visible:ring-violet-400"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="bg-violet-600 hover:bg-violet-700 px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 ml-1">Press Enter to send</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
