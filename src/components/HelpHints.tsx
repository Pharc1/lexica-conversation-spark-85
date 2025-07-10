import React from 'react';
import { Lightbulb, FileText, Type, MessageSquare } from 'lucide-react';

export const HelpHints: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
      <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Ajoutez des fichiers</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Cliquez sur + puis "Ajouter un fichier" pour télécharger vos documents PDF
        </p>
      </div>
      
      <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Type className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Saisissez du texte</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Utilisez "Ajouter du texte" pour intégrer directement du contenu textuel
        </p>
      </div>
      
      <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Posez des questions</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Une fois vos données ajoutées, posez des questions sur leur contenu
        </p>
      </div>
      
      <div className="p-4 rounded-lg border border-border/50 bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Astuce</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Vos conversations et données sont automatiquement sauvegardées
        </p>
      </div>
    </div>
  );
};