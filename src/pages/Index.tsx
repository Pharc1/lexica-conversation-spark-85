
import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ChatInterface } from '@/components/ChatInterface';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Upload, MessageCircle } from 'lucide-react';

const Index = () => {
  const [hasDocuments, setHasDocuments] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');

  const handleUploadSuccess = () => {
    setHasDocuments(true);
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-6">
            <Bot className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-4">
            Lexica
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Assistant IA pour vos politiques d'entreprise
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <Card className="backdrop-blur-sm bg-card/50 border-border/50 shadow-2xl">
            <div className="p-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Documents
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold mb-2">Gestion des documents</h2>
                    <p className="text-muted-foreground">
                      Ajoutez vos documents PDF pour enrichir la base de connaissances
                    </p>
                  </div>
                  <FileUpload onUploadSuccess={handleUploadSuccess} />
                </TabsContent>

                <TabsContent value="chat" className="space-y-6">
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-semibold mb-2">Assistant IA</h2>
                    <p className="text-muted-foreground">
                      Posez vos questions sur les documents téléchargés
                    </p>
                  </div>
                  <ChatInterface hasDocuments={hasDocuments} />
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-muted-foreground">
          <p>Alimenté par l'intelligence artificielle pour vous aider dans vos recherches</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
