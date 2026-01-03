"use client";

import { useRef, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "@/styles/markdown-styles.css";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  Loader2,
  BookOpen,
  Video,
  FileText,
  Code,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { useChat, Source } from "@/hooks/ai/use-chat";

interface AIAssistantProps {
  courseId: string;
  courseName: string;
}

const MAX_CHARACTERS = 1200;

export function AIAssistant({ courseId, courseName }: AIAssistantProps) {
  const { data: session } = useSession();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  const {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    sendMessage,
    clearHistory,
    retry,
    loadHistory,
  } = useChat(courseId, courseName);

  useEffect(() => {
    if (shouldScrollToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages, shouldScrollToBottom]);

  useEffect(() => {
    if (!isLoadingHistory && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      }, 100);
    }
  }, [isLoadingHistory]);

  useEffect(() => {
    if (session && courseId) {
      loadHistory();
    }
  }, [courseId, session, loadHistory]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldScrollToBottom(isNearBottom);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading) return;
    if (inputValue.length > MAX_CHARACTERS) {
      toast.error(`El mensaje no puede exceder ${MAX_CHARACTERS} caracteres`);
      return;
    }
    setShouldScrollToBottom(true);
    sendMessage(inputValue);
    setInputValue("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARACTERS) {
      setInputValue(value);
    }
  };

  const getSourceIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("video") || lowerType === "mp4")
      return <Video className="h-3 w-3" />;
    if (lowerType === "pdf") return <FileText className="h-3 w-3" />;
    if (lowerType.includes("code") || lowerType === "py")
      return <Code className="h-3 w-3" />;
    return <BookOpen className="h-3 w-3" />;
  };

  const handleSourceClick = (source: Source) => {
    toast.info("Fuente del curso", {
      description: `${source.document_title} (Relevancia: ${Math.round(
        source.relevance_score * 100
      )}%)`,
    });
  };

  if (!session) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <CardContent>
          <p className="text-muted-foreground">
            Debes iniciar sesión para usar el asistente
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="h-[600px] flex flex-col overflow-hidden"
      style={{ height: "75vh" }}
    >
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-brand-green" />
          <CardTitle className="text-lg">Asistente IA - {courseName}</CardTitle>
        </div>
        <CardDescription>
          Pregúntame sobre los temas del curso. Tengo acceso a todos los
          recursos y puedo ayudarte a entender mejor el contenido.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col overflow-hidden p-4">
        {isLoadingHistory ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-brand-green" />
              <p className="text-sm text-muted-foreground">
                Cargando conversación...
              </p>
            </div>
          </div>
        ) : (
          <>
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-0"
            >
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.type === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                  )}

                  <div
                    className={`flex-1 ${
                      message.type === "user" ? "flex justify-end" : ""
                    }`}
                  >
                    <div
                      className={`p-3 rounded-lg max-w-full break-words ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {message.isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Escribiendo...</span>
                        </div>
                      ) : (
                        <>
                          <div className="markdown-content text-sm">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                // Código - detecta si es inline o bloque
                                code: ({
                                  node,
                                  className,
                                  children,
                                  ...props
                                }) => {
                                  const match = /language-(\w+)/.exec(
                                    className || ""
                                  );
                                  const isInline = !match;

                                  return isInline ? (
                                    <code
                                      className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  ) : (
                                    <code
                                      className={`block bg-muted p-3 rounded-lg overflow-x-auto text-sm font-mono ${
                                        className || ""
                                      }`}
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  );
                                },
                                // Bloques de código
                                pre: ({ node, children, ...props }) => (
                                  <pre
                                    className="bg-muted p-3 rounded-lg overflow-x-auto my-2"
                                    {...props}
                                  >
                                    {children}
                                  </pre>
                                ),
                                // Listas
                                ul: ({ node, children, ...props }) => (
                                  <ul
                                    className="list-disc list-inside space-y-1 my-2"
                                    {...props}
                                  >
                                    {children}
                                  </ul>
                                ),
                                ol: ({ node, children, ...props }) => (
                                  <ol
                                    className="list-decimal list-inside space-y-1 my-2"
                                    {...props}
                                  >
                                    {children}
                                  </ol>
                                ),
                                // Párrafos
                                p: ({ node, children, ...props }) => (
                                  <p className="mb-2 last:mb-0" {...props}>
                                    {children}
                                  </p>
                                ),
                                // Enlaces
                                a: ({ node, children, ...props }) => (
                                  <a
                                    className="text-primary underline hover:text-primary/80"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    {...props}
                                  >
                                    {children}
                                  </a>
                                ),
                                // Encabezados
                                h1: ({ node, children, ...props }) => (
                                  <h1
                                    className="text-lg font-bold mt-3 mb-2"
                                    {...props}
                                  >
                                    {children}
                                  </h1>
                                ),
                                h2: ({ node, children, ...props }) => (
                                  <h2
                                    className="text-base font-bold mt-2 mb-1"
                                    {...props}
                                  >
                                    {children}
                                  </h2>
                                ),
                                h3: ({ node, children, ...props }) => (
                                  <h3
                                    className="text-sm font-bold mt-2 mb-1"
                                    {...props}
                                  >
                                    {children}
                                  </h3>
                                ),
                                // Citas
                                blockquote: ({ node, children, ...props }) => (
                                  <blockquote
                                    className="border-l-4 border-muted-foreground/20 pl-3 italic my-2"
                                    {...props}
                                  >
                                    {children}
                                  </blockquote>
                                ),
                                // Texto en negrita
                                strong: ({ node, children, ...props }) => (
                                  <strong className="font-semibold" {...props}>
                                    {children}
                                  </strong>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>

                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs font-medium opacity-80">
                                Fuentes consultadas:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {message.sources.map((source, idx) => (
                                  <Button
                                    key={`${source.document_id}-${idx}`}
                                    variant="outline"
                                    size="sm"
                                    className="h-auto p-2 bg-background/50 hover:bg-background/80 text-xs"
                                    onClick={() => handleSourceClick(source)}
                                  >
                                    <div className="flex items-center gap-2 max-w-full">
                                      {getSourceIcon(source.document_type)}
                                      <span className="truncate max-w-[150px]">
                                        {source.document_title}
                                      </span>
                                      <span className="opacity-60 flex-shrink-0">
                                        (
                                        {Math.round(
                                          source.relevance_score * 100
                                        )}
                                        %)
                                      </span>
                                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                    </div>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {message.type === "user" && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-foreground text-sm font-medium">
                        Tú
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button variant="outline" size="sm" onClick={retry}>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reintentar
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t pt-4 flex-shrink-0">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Escribe tu pregunta aquí..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lightbulb className="h-3.5 w-3.5" />
                  <span>
                    Consejo: Un perfil de aprendizaje actualizado me ayuda a
                    darte respuestas más adaptadas a tus necesidades.
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {inputValue.length}/{MAX_CHARACTERS}
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
