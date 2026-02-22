import { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  imageUrl?: string | null;
  createdAt: Timestamp;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
}
