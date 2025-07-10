
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface ApiResponse {
  error?: string;
  message?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const uploadFile = async (file: File): Promise<ApiResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${API_BASE_URL}/file`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Erreur lors du téléchargement');
    }

    return { message: 'Fichier téléchargé avec succès' };
  } catch (error) {
    console.error('Erreur upload:', error);
    return { error: error instanceof Error ? error.message : 'Erreur inconnue' };
  }
};

export const askQuestion = async (
  question: string,
  onChunk: (chunk: string) => void
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la requête');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Impossible de lire la réponse');
    }

    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      onChunk(chunk);
    }
  } catch (error) {
    console.error('Erreur lors de la question:', error);
    onChunk('Une erreur est survenue lors du traitement de votre question.');
  }
};
