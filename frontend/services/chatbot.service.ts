/**
 * Chatbot Service
 * Communicates with the FastAPI AI Assistant backend
 */

const AI_BASE_URL = process.env.NEXT_PUBLIC_AI_URL || 'http://localhost:8000';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp: Date;
}

export interface LLMResponseItem {
  type: string;
  text: string;
  extras?: Record<string, unknown>;
}

export interface ChatResponse {
  answer: string; // Always normalized to string by the service
  sources: string[];
}

export interface UploadResponse {
  message: string;
  doc_id: string;
  accessible_to: string;
}

class ChatbotService {
  /**
   * Extract text content from potentially complex LLM response format
   */
  private extractTextFromResponse(answer: string | Array<LLMResponseItem>): string {
    if (typeof answer === 'string') {
      return answer;
    }
    
    if (Array.isArray(answer)) {
      return answer
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n');
    }
    
    return 'No valid response received.';
  }

  /**
   * Send a message to the chatbot
   * @param question - The user's question
   * @param role - 'user' for general medical chat, 'admin' for RAG-powered chat
   */
  async askQuestion(question: string, role: 'user' | 'admin' = 'user'): Promise<ChatResponse> {
    const response = await fetch(`${AI_BASE_URL}/chat/ask-json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, role }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to get response' }));
      throw new Error(error.detail || 'Failed to get response from AI assistant');
    }

    const data = await response.json();
    
    // Convert complex response format to simple string format for frontend use
    const extractedText = this.extractTextFromResponse(data.answer);
    
    return {
      answer: extractedText,
      sources: data.sources || []
    };
  }

  /**
   * Upload a document to the RAG knowledge base (admin only)
   * @param file - The PDF file to upload
   * @param role - Should be 'admin'
   */
  async uploadDocument(file: File, role: string = 'admin'): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('role', role);

    const response = await fetch(`${AI_BASE_URL}/upload_docs`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail || 'Failed to upload document');
    }

    return response.json();
  }

  /**
   * Health check for the AI backend
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${AI_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const chatbotService = new ChatbotService();
