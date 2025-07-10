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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Lexica</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={startNewConversation}
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              Nouvelle conversation
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setShowOnboarding(true)}
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
            <div data-onboarding="history" className="flex items-center space-x-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <Database className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-80 z-50">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Historique des données
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {dataHistory.map((entry) => (
                        <div key={entry.id} className="p-3 rounded-lg border border-border">
                          <div className="flex items-start gap-2">
                            {entry.type === 'file' ? (
                              <File className="w-4 h-4 text-primary mt-0.5" />
                            ) : (
                              <Type className="w-4 h-4 text-primary mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{entry.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {entry.addedAt.toLocaleDateString()} à {entry.addedAt.toLocaleTimeString()}
                              </div>
                              <Badge variant="secondary" className="text-xs mt-1">
                                {entry.type === 'file' ? 'Fichier' : 'Texte'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                      {dataHistory.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Aucune donnée ajoutée
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <History className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-80 z-50">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Historique des conversations
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {conversations.map((conv) => (
                        <div key={conv.id} className="group relative">
                          <Button
                            variant={currentConversationId === conv.id ? "secondary" : "ghost"}
                            className="w-full justify-start h-auto p-3 pr-10"
                            onClick={() => loadConversation(conv)}
                          >
                            <div className="text-left w-full">
                              <div className="font-medium text-sm truncate">{conv.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {conv.updatedAt.toLocaleDateString()}
                              </div>
                            </div>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteConversation(conv.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                      {conversations.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Aucune conversation enregistrée
                        </p>
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
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl animate-fade-in">
              <div className="text-center mb-12">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-primary-foreground font-bold text-2xl">L</span>
              </div>
              <h1 className="text-4xl font-light text-foreground mb-3">Lexica</h1>
              <p className="text-muted-foreground text-lg">Comment puis-je vous aider aujourd&apos;hui ?</p>
              {dataHistory.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Commencez par ajouter du contenu avec le bouton + ci-dessous
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
              
              <div className="flex items-center bg-card border border-border rounded-xl p-3 shadow-sm">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isUploading || isLoading}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      data-onboarding="add-button"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-card border border-border shadow-lg z-50">
                    <DropdownMenuItem 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <File className="w-4 h-4" />
                      Ajouter un fichier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTextModalOpen(true)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Type className="w-4 h-4" />
                      Ajouter du texte
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={dataHistory.length === 0 ? "Ajoutez d'abord du contenu avec +" : "Tapez votre message..."}
                  disabled={isLoading || dataHistory.length === 0}
                  className="border-0 bg-transparent focus-visible:ring-0 text-base"
                  data-onboarding="input"
                />
                
                <Button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading || dataHistory.length === 0}
                  size="icon"
                  className="h-8 w-8 bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Upload Error */}
              {uploadError && (
                <ErrorDisplay 
                  message={uploadError} 
                  className="mt-4"
                />
              )}
              
              {/* Chat Error */}
              {chatError && (
                <ErrorDisplay 
                  message={chatError} 
                  className="mt-4"
                />
              )}
            </div>
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Upload className="w-4 h-4 text-primary animate-pulse" />
                    <div className="flex-1">
                      <div className="text-sm text-foreground mb-1">Téléchargement en cours...</div>
                      <div className="w-full bg-border rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{uploadProgress}%</div>
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
          <div className="flex-1 px-4 py-6">
            <ScrollArea className="h-full custom-scrollbar">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-up`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`flex items-start space-x-3 max-w-2xl ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-smooth hover-lift ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {message.type === 'user' ? <User className="w-3 h-3" /> : 'AI'}
                      </div>
                      
                      <div className={`rounded-2xl px-4 py-3 transition-smooth hover-lift ${
                        message.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        {message.isLoading ? (
                          <div className="flex items-center space-x-1">
                            <div className="flex space-x-1">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm leading-relaxed">
                              <p className="whitespace-pre-wrap">{message.content}</p>
                            </div>
                            
                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <p className="text-xs text-muted-foreground mb-2">Sources :</p>
                                <div className="flex flex-wrap gap-1">
                                  {message.sources.map((source, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
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
          <div className="border-t border-border bg-background/80 backdrop-blur-sm px-4 py-4">
            <div className="max-w-3xl mx-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              
              <div className="flex items-center bg-card border border-border rounded-xl p-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isUploading || isLoading}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 bg-card border border-border shadow-lg z-50">
                    <DropdownMenuItem 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <File className="w-4 h-4" />
                      Ajouter un fichier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setTextModalOpen(true)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Type className="w-4 h-4" />
                      Ajouter du texte
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message..."
                  disabled={isLoading}
                  className="border-0 bg-transparent focus-visible:ring-0"
                />
                
                {/* Chat Error in fixed input */}
                {chatError && (
                  <div className="absolute -top-16 left-0 right-0">
                    <ErrorDisplay 
                      message={chatError} 
                    />
                  </div>
                )}
                
                <Button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="h-8 w-8 bg-primary hover:bg-primary/90"
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ajouter du texte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Saisissez votre texte ici..."
              className="min-h-[200px] resize-none"
            />
            
            {/* Text Error */}
            {textError && (
              <ErrorDisplay 
                message={textError} 
              />
            )}
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setTextModalOpen(false);
                  setTextInput('');
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleTextSubmit}
                disabled={!textInput.trim() || isUploading}
                className="bg-primary hover:bg-primary/90"
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
