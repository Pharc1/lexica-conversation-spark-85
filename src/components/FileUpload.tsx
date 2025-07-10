
import React, { useState, useRef } from 'react';
import { Upload, File, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { uploadFile } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onUploadSuccess?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Format non supporté",
        description: "Seuls les fichiers PDF sont acceptés.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const result = await uploadFile(file);
      
      if (result.error) {
        toast({
          title: "Erreur de téléchargement",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setUploadedFiles(prev => [...prev, file.name]);
        toast({
          title: "Fichier téléchargé",
          description: "Le document a été ajouté avec succès à la base de connaissances.",
        });
        onUploadSuccess?.();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors">
        <div className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Ajouter un document</h3>
          <p className="text-muted-foreground mb-4">
            Téléchargez un fichier PDF pour enrichir la base de connaissances
          </p>
          
          <Button
            onClick={handleFileSelect}
            disabled={uploading}
            className="relative"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Traitement en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Choisir un fichier PDF
              </>
            )}
          </Button>
        </div>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center">
            <Check className="w-4 h-4 text-green-500 mr-2" />
            Documents ajoutés
          </h4>
          <div className="space-y-2">
            {uploadedFiles.map((fileName, index) => (
              <div key={index} className="flex items-center text-sm text-muted-foreground">
                <File className="w-4 h-4 mr-2" />
                {fileName}
              </div>
            ))}
          </div>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
