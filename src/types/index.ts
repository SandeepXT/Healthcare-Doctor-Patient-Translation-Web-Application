export type Role = 'DOCTOR' | 'PATIENT';

export type Language = 'en' | 'hi';

export interface Message {
  id: string;
  conversationId: string;
  role: Role;
  originalText: string;
  translatedText: string | null;
  originalLang: Language;
  targetLang: Language;
  audioUrl: string | null;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages?: Message[];
  summary: string | null;
}

export interface TranslationRequest {
  text: string;
  sourceLang: Language;
  targetLang: Language;
}

export interface TranslationResponse {
  translatedText: string;
}

export interface SummaryRequest {
  conversationId: string;
}

export interface SummaryResponse {
  summary: string;
  medicalHighlights: {
    symptoms: string[];
    diagnoses: string[];
    medications: string[];
    followUp: string[];
  };
}

export interface AudioTranscriptionRequest {
  audioBlob: Blob;
  language: Language;
}

export interface AudioTranscriptionResponse {
  text: string;
}
