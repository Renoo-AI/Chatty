import {
  collection,
  addDoc,
  serverTimestamp,
  type DocumentReference
} from 'firebase/firestore';
import { db } from './config';

export const sendMessage = async (
  roomId: string,
  text: string,
  senderId: string,
  senderName: string,
  mediaUrl?: string
): Promise<DocumentReference> => {
  const messagesRef = collection(db, 'rooms', roomId, 'messages');

  return addDoc(messagesRef, {
    text,
    senderId,
    senderName,
    createdAt: serverTimestamp(),
    ...(mediaUrl && { imageUrl: mediaUrl })
  });
};
