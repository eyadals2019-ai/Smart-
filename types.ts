export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  attachment?: {
    url: string;
    name: string;
  };
}