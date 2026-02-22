import {
  collection,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

export const sendMessage = async (
  roomId: string,
  text: string,
  senderId: string,
  senderName: string,
  senderAvatar?: string | null,
  imageUrl?: string
) => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages');
  return addDoc(messagesRef, {
    text,
    senderId,
    senderName,
    senderAvatar: senderAvatar || null,
    imageUrl: imageUrl || null,
    createdAt: serverTimestamp(),
  });
};
