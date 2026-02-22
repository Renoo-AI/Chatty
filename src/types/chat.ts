import { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  createdAt: Timestamp;
  imageUrl?: string;
  fileUrl?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  createdAt: Timestamp;
}
