import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, User, FileText, Upload, History, MessageSquare, Trash2, Type, File, Database, Clock, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { OnboardingTooltip } from '@/components/OnboardingTooltip';

interface Source {
  title: string;
  page?: number;
  relevance?: number;
}

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  sources?: Source[];
  isLoading?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface DataEntry {
  id: string;
  type: 'file' | 'text';
  name: string;
  content?: string;
  addedAt: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [dataHistory, setDataHistory] = useState<DataEntry[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if user is new
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding && !hasStartedChat && dataHistory.length === 0) {
      setShowOnboarding(true);
    }
  }, [hasStartedChat, dataHistory.length]);

  const onboardingSteps = [
    {
      id: 'add-button',
      target: '[data-onboarding="add-button"]',
      title: 'Ajouter du contenu',
      description: 'Cliquez ici pour ajouter des fichiers PDF ou du texte directement',
      position: 'bottom' as const
    },
    {
      id: 'input',
      target: '[data-onboarding="input"]',
      title: 'Poser des questions',
      description: 'Une fois vos données ajoutées, tapez vos questions ici',
      position: 'top' as const
    },
    {
      id: 'history',
      target: '[data-onboarding="history"]',
      title: 'Vos historiques',
      description: 'Accédez à vos données et conversations précédentes',
      position: 'bottom' as const
    }
  ];

  const completeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations and data history from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      setConversations(parsed.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
        messages: c.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      })));
    }

    const savedDataHistory = localStorage.getItem('dataHistory');
    if (savedDataHistory) {
      const parsed = JSON.parse(savedDataHistory);
      setDataHistory(parsed.map((d: any) => ({
        ...d,
        addedAt: new Date(d.addedAt)
      })));
    }
  }, []);

  // Save conversations and data history to localStorage when they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem('conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    if (dataHistory.length > 0) {
      localStorage.setItem('dataHistory', JSON.stringify(dataHistory));
    }
  }, [dataHistory]);

  // Save current conversation when messages change
  useEffect(() => {
    if (messages.length > 0 && hasStartedChat) {
      const conversationTitle = messages[0]?.content.slice(0, 50) + (messages[0]?.content.length > 50 ? '...' : '') || 'Nouvelle conversation';
      
      if (currentConversationId) {
        // Update existing conversation
        setConversations(prev => prev.map(conv =>
          conv.id === currentConversationId
            ? { ...conv, messages, updatedAt: new Date(), title: conversationTitle }
            : conv
        ));
      } else {
        // Create new conversation
        const newConversationId = Date.now().toString();
        const newConversation: Conversation = {
          id: newConversationId,
          title: conversationTitle,
          messages,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setConversations(prev => [newConversation, ...prev]);
        setCurrentConversationId(newConversationId);
      }
    }
  }, [messages, hasStartedChat, currentConversationId]);

  const startNewConversation = () => {
    setMessages([]);
    setHasStartedChat(false);
    setCurrentConversationId(null);
    setInputValue('');
  };

  const loadConversation = (conversation: Conversation) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
    setHasStartedChat(true);
  };

  const deleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    if (currentConversationId === conversationId) {
      startNewConversation();
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setChatError(null);
    setHasStartedChat(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: '',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/ask', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: content }),
        cache: "no-cache"
      });

      if (!response.ok) {
        throw new Error("Erreur de réseau : " + response.statusText);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullResponse = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          fullResponse += chunk;
          
          setMessages(prev => prev.map(msg => 
            msg.id === botMessage.id 
              ? { ...msg, content: fullResponse, isLoading: false }
              : msg
          ));
        }
      }

      const sources = extractSourcesFromResponse(fullResponse);
      
      setMessages(prev => prev.map(msg => 
        msg.id === botMessage.id 
          ? { ...msg, sources, isLoading: false }
          : msg
      ));

    } catch (error) {
      console.error("Erreur lors de la requête : ", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      setChatError(errorMessage);
      setMessages(prev => prev.map(msg => 
        msg.id === botMessage.id 
          ? { ...msg, content: "Désolé, une erreur s'est produite lors du traitement de votre demande.", isLoading: false }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const extractSourcesFromResponse = (response: string): Source[] => {
    const mockSources = [
      { title: "Document interne", page: 15, relevance: 0.92 },
      { title: "Guide utilisateur", page: 42, relevance: 0.85 }
    ];
    return mockSources;
  };

  const handleFileUpload = async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      setUploadError('Veuillez sélectionner un fichier PDF valide');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/file', {
        method: "POST",
        body: formData,
        cache: "no-cache"
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'upload : " + response.statusText);
      }

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }

      // Add to data history without success message
      const dataEntry: DataEntry = {
        id: Date.now().toString(),
        type: 'file',
        name: file.name,
        addedAt: new Date()
      };
      setDataHistory(prev => [dataEntry, ...prev]);

    } catch (error) {
      console.error("Erreur lors de l'upload : ", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      setTextError('Veuillez saisir du texte');
      return;
    }

    setTextError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await fetch('/text', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput }),
        cache: "no-cache"
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du texte : " + response.statusText);
      }

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      const reader = response.body?.getReader();
      if (reader) {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      }

      setHasStartedChat(true);
      setTextModalOpen(false);

      // Add to data history without success message
      const dataEntry: DataEntry = {
        id: Date.now().toString(),
        type: 'text',
        name: textInput.slice(0, 50) + (textInput.length > 50 ? '...' : ''),
        content: textInput,
        addedAt: new Date()
      };
      setDataHistory(prev => [dataEntry, ...prev]);

      setTextInput('');

    } catch (error) {
      console.error("Erreur lors de l'envoi du texte : ", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      setTextError(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
      {/* Modern Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-r from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-primary-foreground font-bold text-lg">L</span>
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl blur opacity-75" />
            </div>
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Lexica
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              onClick={startNewConversation}
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
            >
              Nouvelle conversation
            </Button>
            
            <div className="h-4 w-px bg-border/60" />
            
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-muted/50 transition-all duration-200"
              onClick={() => setShowOnboarding(true)}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
            
            <div data-onboarding="history" className="flex items-center space-x-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 border-border/60 hover:border-border hover:bg-muted/50 transition-all duration-200">
                    <Database className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-80 z-50 border-border/60">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Historique des données
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {dataHistory.map((entry) => (
                          <div key={entry.id} className="p-3 rounded-lg border border-border/60 bg-card/50 hover:bg-card transition-colors duration-200">
                            <div className="flex items-start gap-3">
                              {entry.type === 'file' ? (
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <File className="w-4 h-4 text-primary" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center">
                                  <Type className="w-4 h-4 text-secondary-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate text-foreground">{entry.name}</div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" />
                                  {entry.addedAt.toLocaleDateString()} à {entry.addedAt.toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {dataHistory.length === 0 && (
                          <div className="text-center py-12">
                            <Database className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                              Aucune donnée ajoutée
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </SheetContent>
              </Sheet>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9 border-border/60 hover:border-border hover:bg-muted/50 transition-all duration-200">
                    <History className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-80 z-50 border-border/60">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Conversations
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {conversations.map((conv) => (
                          <div key={conv.id} className="group relative">
                            <Button
                              variant={currentConversationId === conv.id ? "secondary" : "ghost"}
                              className="w-full justify-start h-auto p-3 text-left hover:bg-muted/50 transition-all duration-200"
                              onClick={() => loadConversation(conv)}
                            >
                              <div className="pr-8 w-full">
                                <div className="font-medium text-sm truncate">{conv.title}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {conv.updatedAt.toLocaleDateString()}
                                </div>
                              </div>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conv.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                        {conversations.length === 0 && (
                          <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                              Aucune conversation
                            </p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Initial centered input state */}
      {!hasStartedChat && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-16">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-primary via-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-primary/25">
                  <span className="text-primary-foreground font-bold text-3xl">L</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-primary/10 rounded-3xl blur-xl scale-110" />
              </div>
              
              <h1 className="text-5xl font-light bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
                Lexica
              </h1>
              
              {dataHistory.length === 0 ? (
                <p className="text-muted-foreground text-lg">
                  Commencez par ajouter votre contenu
                </p>
              ) : (
                <p className="text-muted-foreground text-lg">
                  Posez votre question
                </p>
              )}
            </div>
            
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              
              <div className="flex items-center bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-4 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-300">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isUploading || isLoading}
                      className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                      data-onboarding="add-button"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52 bg-card/95 backdrop-blur-sm border-border/60 shadow-xl z-50">
                    <DropdownMenuItem 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-3 cursor-pointer p-3 hover:bg-muted/50 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <File className="w-4 h-4 text-primary" />
                      </div>
                      <span>Ajouter un fichier</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTextModalOpen(true)}
                      className="flex items-center gap-3 cursor-pointer p-3 hover:bg-muted/50 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center">
                        <Type className="w-4 h-4 text-secondary-foreground" />
                      </div>
                      <span>Ajouter du texte</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={dataHistory.length === 0 ? "Ajoutez d'abord du contenu..." : "Tapez votre message..."}
                  disabled={isLoading || dataHistory.length === 0}
                  className="border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-muted-foreground/60"
                  data-onboarding="input"
                />
                
                <Button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading || dataHistory.length === 0}
                  size="icon"
                  className="h-10 w-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Errors */}
              {uploadError && (
                <ErrorDisplay 
                  message={uploadError} 
                  className="mt-4"
                />
              )}
              
              {chatError && (
                <ErrorDisplay 
                  message={chatError} 
                  className="mt-4"
                />
              )}
            </div>
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-6">
                <div className="bg-card/80 backdrop-blur-sm border border-border/60 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-primary animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-foreground mb-2">Téléchargement en cours...</div>
                      <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground tabular-nums">{uploadProgress}%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat mode */}
      {hasStartedChat && (
        <>
          {/* Messages */}
          <div className="flex-1 px-6 py-8">
            <ScrollArea className="h-full custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-8">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-up`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`flex items-start space-x-4 max-w-3xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25' 
                          : 'bg-muted/80 text-muted-foreground'
                      }`}>
                        {message.type === 'user' ? <User className="w-4 h-4" /> : <span className="font-bold text-xs">AI</span>}
                      </div>
                      
                      <div className={`rounded-2xl px-6 py-4 shadow-sm transition-all duration-200 hover:shadow-md ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground' 
                          : 'bg-card/80 backdrop-blur-sm border border-border/40'
                      }`}>
                        {message.isLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm leading-relaxed">
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                            
                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border/40">
                                <p className="text-xs text-muted-foreground mb-3 font-medium">Sources :</p>
                                <div className="flex flex-wrap gap-2">
                                  {message.sources.map((source, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs bg-muted/50 hover:bg-muted transition-colors duration-200">
                                      <FileText className="w-3 h-3 mr-1" />
                                      {source.title}
                                      {source.page && ` (p.${source.page})`}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Fixed input at bottom */}
          <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl px-6 py-4 sticky bottom-0">
            <div className="max-w-4xl mx-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              
              <div className="flex items-center bg-card/80 backdrop-blur-sm border border-border/60 rounded-2xl p-3 shadow-lg">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isUploading || isLoading}
                      className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52 bg-card/95 backdrop-blur-sm border-border/60 shadow-xl z-50">
                    <DropdownMenuItem 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-3 cursor-pointer p-3 hover:bg-muted/50 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <File className="w-4 h-4 text-primary" />
                      </div>
                      <span>Ajouter un fichier</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTextModalOpen(true)}
                      className="flex items-center gap-3 cursor-pointer p-3 hover:bg-muted/50 transition-colors duration-200"
                    >
                      <div className="w-8 h-8 rounded-lg bg-secondary/80 flex items-center justify-center">
                        <Type className="w-4 h-4 text-secondary-foreground" />
                      </div>
                      <span>Ajouter du texte</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message..."
                  disabled={isLoading}
                  className="border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/60"
                />
                
                {chatError && (
                  <div className="absolute -top-20 left-0 right-0 z-10">
                    <ErrorDisplay 
                      message={chatError} 
                    />
                  </div>
                )}
                
                <Button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="h-9 w-9 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-200"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Text Input Modal */}
      <Dialog open={textModalOpen} onOpenChange={setTextModalOpen}>
        <DialogContent className="sm:max-w-[600px] border-border/60 bg-card/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Ajouter du texte</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Saisissez votre texte ici..."
              className="min-h-[200px] resize-none border-border/60 bg-background/50 focus:bg-background transition-colors duration-200"
            />
            
            {textError && (
              <ErrorDisplay 
                message={textError} 
              />
            )}
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setTextModalOpen(false);
                  setTextInput('');
                  setTextError(null);
                }}
                className="border-border/60"
              >
                Annuler
              </Button>
              <Button
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || isUploading}
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
              >
                {isUploading ? "Envoi..." : "Valider"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Onboarding */}
      <OnboardingTooltip
        steps={onboardingSteps}
        isActive={showOnboarding}
        onComplete={completeOnboarding}
        onSkip={completeOnboarding}
      />
    </div>
  );
};

export default Index;
