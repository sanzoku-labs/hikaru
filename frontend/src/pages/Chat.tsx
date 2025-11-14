import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ChatHistorySidebar } from "@/components/chat/ChatHistorySidebar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Paperclip, BarChart3, Bot } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  firstQuestion: string;
  timestamp: string;
  isActive: boolean;
}

const mockSessions: ChatSession[] = [
  {
    id: "1",
    title: "Sales Trends Analysis",
    firstQuestion: "What are the key trends in Q4 sales data?",
    timestamp: "2 hours ago",
    isActive: true,
  },
  {
    id: "2",
    title: "Customer Segmentation",
    firstQuestion: "How can I segment my customers?",
    timestamp: "1 day ago",
    isActive: false,
  },
  {
    id: "3",
    title: "Revenue Forecast",
    firstQuestion: "What is the revenue projection for next quarter?",
    timestamp: "3 days ago",
    isActive: false,
  },
];

const suggestedQuestions = [
  {
    title: "What are the top performing products?",
    subtitle: "Analyze product performance metrics",
  },
  {
    title: "Show me regional sales comparison",
    subtitle: "Compare sales across different regions",
  },
  {
    title: "Identify revenue trends over time",
    subtitle: "Analyze temporal revenue patterns",
  },
  {
    title: "What anomalies exist in the data?",
    subtitle: "Detect unusual patterns and outliers",
  },
];

export function Chat() {
  const [sessions, setSessions] = useState<ChatSession[]>(mockSessions);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "user",
      content: "What are the key trends in Q4 sales data?",
      timestamp: "2:30 PM",
    },
    {
      id: "2",
      role: "assistant",
      content:
        "Based on your Q4 sales data analysis, here are the key trends I've identified:\n\n• 23% increase in overall revenue compared to Q3\n• Electronics category shows the strongest growth (42% of total revenue)\n• December recorded peak performance with $1.2M in sales\n• Customer retention rate improved by 15%\n• Average order value increased from $142 to $179\n\nThe data shows a consistent upward trend throughout the quarter, with notable spikes during the holiday shopping season. Would you like me to create visualizations for any of these trends?",
      timestamp: "2:31 PM",
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedContext, setSelectedContext] = useState("sales-analytics-q4");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessions(sessions.map((s) => ({ ...s, isActive: false })));
  };

  const handleSelectSession = (sessionId: string) => {
    setSessions(sessions.map((s) => ({ ...s, isActive: s.id === sessionId })));
    // TODO: Load messages for selected session
  };

  const handleSendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // TODO: Call AI query API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "This is a simulated AI response. In production, this will connect to the Claude API to provide intelligent answers based on your data.",
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Failed to get response:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  const showWelcome = messages.length === 0;

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Chat History Sidebar */}
        <ChatHistorySidebar
          sessions={sessions}
          onNewChat={handleNewChat}
          onSelectSession={handleSelectSession}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Interactive Q&A Chat
                </h2>
                <p className="text-gray-600 mt-1">
                  Ask questions about your data and get AI-powered insights
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Select
                  value={selectedContext}
                  onValueChange={setSelectedContext}
                >
                  <SelectTrigger className="px-4 py-2 border border-gray-300 rounded-lg w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales-analytics-q4">
                      Sales Analytics Q4
                    </SelectItem>
                    <SelectItem value="customer-data">Customer Data</SelectItem>
                    <SelectItem value="product-catalog">
                      Product Catalog
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-8">
            {showWelcome ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="text-primary text-2xl h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to Interactive Q&A
                </h3>
                <p className="text-gray-600 mb-6">
                  Ask me anything about your Sales Analytics Q4 data and I'll
                  provide insights and analysis
                </p>

                {/* Suggested Questions Grid */}
                <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestedQuestion(q.title)}
                      className="p-4 text-left border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <p className="font-medium text-gray-900 text-sm mb-1">
                        {q.title}
                      </p>
                      <p className="text-gray-500 text-xs">{q.subtitle}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto">
                {messages.map((message) => (
                  <div key={message.id}>
                    {message.role === "user" ? (
                      /* User Message - Right Aligned */
                      <div className="flex justify-end">
                        <div className="max-w-2xl">
                          <div className="flex items-end space-x-3">
                            <div className="bg-primary text-white rounded-2xl rounded-br-md px-4 py-3">
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-gray-600">
                                You
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 text-right">
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* AI Message - Left Aligned */
                      <div className="flex justify-start">
                        <div className="max-w-2xl">
                          <div className="flex items-end space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <Bot className="text-primary text-sm h-4 w-4" />
                            </div>
                            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex-1">
                              <p className="text-sm text-gray-800 whitespace-pre-line">
                                {message.content}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 ml-11">
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading Indicator */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="max-w-2xl">
                      <div className="flex items-end space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="text-primary text-sm h-4 w-4 animate-pulse" />
                        </div>
                        <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
                            <div
                              className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            />
                            <div
                              className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                              style={{ animationDelay: "0.4s" }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-6 bg-white">
            <div className="flex items-end space-x-4">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask me anything about your data..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={2}
                disabled={loading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || loading}
                className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 h-auto"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Paperclip className="mr-2 h-4 w-4" />
                  <span className="text-sm">Attach</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span className="text-sm">Visualize</span>
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
