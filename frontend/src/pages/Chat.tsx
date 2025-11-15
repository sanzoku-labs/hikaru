import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, ArrowLeft, Bot, User, AlertCircle } from "lucide-react";
import { api } from "@/services/api";
import type { FileInProject } from "@/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export function Chat() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [files, setFiles] = useState<FileInProject[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadFiles = async () => {
    if (!projectId) {
      setError("No project selected. Please select a project first.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const projectFiles = await api.listProjectFiles(parseInt(projectId));
      setFiles(projectFiles);

      // Auto-select first file with analysis
      const fileWithAnalysis = projectFiles.find((f) => f.has_analysis);
      if (fileWithAnalysis) {
        setSelectedFileId(fileWithAnalysis.id);
      } else if (projectFiles.length > 0) {
        setSelectedFileId(projectFiles[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load project files");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const text = input.trim();
    if (!text || !selectedFileId) return;

    // Get upload_id from selected file
    const selectedFile = files.find((f) => f.id === selectedFileId);
    if (!selectedFile) return;

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
    setSending(true);

    try {
      const response = await api.queryData({
        upload_id: selectedFile.upload_id,
        question: text,
        conversation_id: conversationId || undefined,
      });

      // Update conversation ID if this is the first message
      if (!conversationId) {
        setConversationId(response.conversation_id);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.answer,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What are the key trends in this data?",
    "What anomalies or outliers exist?",
    "Summarize the main findings",
    "What insights can you provide?",
  ];

  if (loading) {
    return (
      <Layout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (!projectId) {
    return (
      <Layout>
        <div className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a project from the Projects page to chat.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/projects")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Projects
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AI Q&A Chat</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Ask questions about your data and get AI-powered insights
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
          </div>

          {/* File Selector */}
          {files.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-medium mb-2 block">
                Select File:
              </label>
              <select
                className="w-full max-w-md px-3 py-2 border rounded-md"
                value={selectedFileId?.toString() || ""}
                onChange={(e) => {
                  setSelectedFileId(parseInt(e.target.value));
                  setMessages([]);
                  setConversationId(null);
                }}
              >
                <option value="">Select a file...</option>
                {files.map((file) => (
                  <option key={file.id} value={file.id}>
                    {file.filename} {file.has_analysis ? "✓" : ""}
                  </option>
                ))}
              </select>
              {selectedFileId &&
                !files.find((f) => f.id === selectedFileId)?.has_analysis && (
                  <p className="text-sm text-orange-600 mt-1">
                    This file hasn't been analyzed yet. Analyze it first for
                    better insights.
                  </p>
                )}
            </div>
          )}
        </div>

        {error && (
          <div className="px-6 pt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-6">
              <Bot className="h-16 w-16 text-gray-400" />
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">
                  Start a Conversation
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Ask questions about your data and get AI-powered insights
                  based on your analysis.
                </p>
              </div>

              {selectedFileId && (
                <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
                  {suggestedQuestions.map((question, index) => (
                    <Card
                      key={index}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => setInput(question)}
                    >
                      <CardContent className="p-4">
                        <p className="text-sm">{question}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
              )}

              <div
                className={`max-w-[70%] rounded-lg px-4 py-3 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-2 opacity-70">{message.timestamp}</p>
              </div>

              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t bg-white px-6 py-4">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                selectedFileId
                  ? "Ask a question about your data..."
                  : "Select a file to start chatting..."
              }
              disabled={!selectedFileId || sending}
              className="flex-1 px-4 py-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={1}
              style={{ minHeight: "52px", maxHeight: "200px" }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || !selectedFileId || sending}
              size="lg"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* No Files Message */}
        {files.length === 0 && !loading && (
          <div className="flex-1 flex items-center justify-center">
            <Card className="max-w-md">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">No Files Found</p>
                <p className="text-gray-600 text-center mb-6">
                  Upload files to this project to start chatting about your
                  data.
                </p>
                <Button onClick={() => navigate(`/projects/${projectId}`)}>
                  Go to Project
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
