import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Send, 
  Paperclip, 
  Calendar, 
  Phone, 
  Video,
  MoreVertical,
  Smile,
  Image,
  File,
  Clock,
  CheckCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { showErrorToast, showSuccessToast, handleAsyncOperation } from '@/lib/errorHandling';

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  // Mock conversations for now - will be replaced with real data
  const mockConversations = [
    {
      id: 1,
      name: "Sarah Chen",
      avatar: "SC",
      lastMessage: "Great! Let's schedule the React session for tomorrow",
      timestamp: "2 min ago",
      unreadCount: 2,
      online: true,
      skill: "React Development",
      type: "learning"
    },
    {
      id: 2,
      name: "Mike Johnson",
      avatar: "MJ", 
      lastMessage: "Thanks for the Python explanation!",
      timestamp: "1 hour ago",
      unreadCount: 0,
      online: false,
      skill: "Python Basics",
      type: "teaching"
    },
    {
      id: 3,
      name: "Emma Wilson",
      avatar: "EW",
      lastMessage: "Could you share that Figma file?",
      timestamp: "3 hours ago", 
      unreadCount: 1,
      online: true,
      skill: "UI/UX Design",
      type: "learning"
    },
    {
      id: 4,
      name: "David Kim",
      avatar: "DK",
      lastMessage: "The data visualization looks perfect!",
      timestamp: "Yesterday",
      unreadCount: 0,
      online: false,
      skill: "Data Science",
      type: "collaboration"
    }
  ];

  // Mock messages for now - will be replaced with real data
  const mockMessages = [
    {
      id: 1,
      sender: "other",
      content: "Hi! I'm excited to start learning React with you. When would be a good time for our first session?",
      timestamp: "10:30 AM",
      type: "text"
    },
    {
      id: 2,
      sender: "me",
      content: "Hello! I'm excited too. How about we start with the fundamentals? Are you free this Saturday afternoon?",
      timestamp: "10:35 AM",
      type: "text"
    },
    {
      id: 3,
      sender: "other",
      content: "Saturday works perfect! Should I prepare anything beforehand?",
      timestamp: "10:37 AM",
      type: "text"
    },
    {
      id: 4,
      sender: "me",
      content: "Just make sure you have Node.js installed. I'll share a starter project with you.",
      timestamp: "10:40 AM",
      type: "text"
    },
    {
      id: 5,
      sender: "me",
      content: "react-starter-project.zip",
      timestamp: "10:41 AM", 
      type: "file"
    },
    {
      id: 6,
      sender: "other",
      content: "Perfect! Downloaded it. What time on Saturday?",
      timestamp: "10:45 AM",
      type: "text"
    },
    {
      id: 7,
      sender: "me",
      content: "How about 2:00 PM? We can do a 2-hour session to cover the basics.",
      timestamp: "11:00 AM",
      type: "text"
    },
    {
      id: 8,
      sender: "other",
      content: "Great! Let's schedule the React session for tomorrow",
      timestamp: "Just now",
      type: "text"
    }
  ];

  // Load conversations and messages
  useEffect(() => {
    loadMessages();
    // For now, use mock data
    setConversations(mockConversations);
  }, []);

  const loadMessages = async () => {
    if (!user) return;
    
    setLoading(true);
    
    const result = await handleAsyncOperation(async () => {
      const apiResult = await apiService.getMessages();
      if (apiResult.error) {
        throw new Error(apiResult.error);
      }
      return apiResult.data;
    });
    
    if (result && Array.isArray(result)) {
      // Process messages into conversations format
      const processedMessages = result.map((msg: any) => ({
        id: msg._id,
        sender: msg.sender._id === user._id ? 'me' : 'other',
        content: msg.content,
        timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text',
        isRead: msg.isRead,
        senderId: msg.sender._id,
        receiverId: msg.receiver._id
      }));
      setMessages(processedMessages);
    } else {
      // Use mock data as fallback when API fails
      setMessages(mockMessages);
    }
    
    setLoading(false);
  };

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !user) return;
    
    setSending(true);
    
    const result = await handleAsyncOperation(
      async () => {
        // Find the conversation to get the receiver ID
        const conversation = conversations.find(c => c.id === selectedConversation);
        if (!conversation) {
          throw new Error('Conversation not found');
        }

        const apiResult = await apiService.sendMessage({
          receiver: conversation.userId, // This would need to be added to conversation data
          content: messageText.trim()
        });

        if (apiResult.error) {
          throw new Error(apiResult.error);
        }
        
        return apiResult.data;
      },
      "Your message has been sent successfully.",
      "Failed to Send Message"
    );

    if (result) {
      setMessageText('');
      await loadMessages();
    }
    
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isLoggedIn={true} />
      
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
          
          {/* Conversations Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Messages
                <Badge>{conversations.filter(c => c.unreadCount > 0).length} unread</Badge>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Search conversations..." className="pl-10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedConversation === conversation.id ? 'bg-muted' : ''
                    }`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                            {conversation.avatar}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-sm truncate">{conversation.name}</h3>
                          <span className="text-xs text-muted-foreground">{conversation.timestamp}</span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <Badge 
                            variant={conversation.type === 'learning' ? 'default' : conversation.type === 'teaching' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {conversation.type === 'learning' ? 'Learning' : conversation.type === 'teaching' ? 'Teaching' : 'Collaborating'}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-1">{conversation.skill}</p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground truncate flex-1">
                            {conversation.lastMessage}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge className="ml-2 min-w-5 h-5 text-xs bg-primary">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {currentConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                            {currentConversation.avatar}
                          </AvatarFallback>
                        </Avatar>
                        {currentConversation.online && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{currentConversation.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={currentConversation.type === 'learning' ? 'default' : currentConversation.type === 'teaching' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {currentConversation.skill}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {currentConversation.online ? 'Online' : 'Last seen 1 hour ago'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Calendar className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-0">
                  <div className="p-4 space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md ${message.sender === 'me' ? 'order-1' : 'order-2'}`}>
                          {message.type === 'file' ? (
                            <div className={`p-3 rounded-lg ${
                              message.sender === 'me' 
                                ? 'bg-primary text-primary-foreground ml-auto' 
                                : 'bg-muted'
                            }`}>
                              <div className="flex items-center gap-2">
                                <File className="h-4 w-4" />
                                <span className="text-sm font-medium">{message.content}</span>
                              </div>
                            </div>
                          ) : (
                            <div className={`p-3 rounded-lg ${
                              message.sender === 'me' 
                                ? 'bg-primary text-primary-foreground ml-auto' 
                                : 'bg-muted'
                            }`}>
                              <p className="text-sm">{message.content}</p>
                            </div>
                          )}
                          <div className={`flex items-center gap-1 mt-1 ${
                            message.sender === 'me' ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                            {message.sender === 'me' && (
                              <CheckCheck className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        
                        {message.sender !== 'me' && (
                          <Avatar className="w-8 h-8 order-1 mr-2">
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                              {currentConversation.avatar}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <Textarea 
                        placeholder="Type your message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="min-h-12 max-h-32 resize-none"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Image className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button onClick={sendMessage} size="sm" disabled={sending || !messageText.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a conversation from the sidebar to start messaging</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Session Scheduling Card */}
        {currentConversation && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button onClick={() => navigate('/schedule')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Session
                </Button>
                <Button variant="outline">
                  <File className="mr-2 h-4 w-4" />
                  Share Resources
                </Button>
                <Button variant="outline">
                  <Clock className="mr-2 h-4 w-4" />
                  Set Milestone
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Messages;