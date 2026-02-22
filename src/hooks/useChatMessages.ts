import { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../services/firebase/config';
import type { Message } from '../types/chat';

export const useChatMessages = (roomId: string, initialLimit: number = 25) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLimit, setCurrentLimit] = useState(initialLimit);

  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(currentLimit)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      // Reverse to get chronological order in the UI
      setMessages(fetchedMessages.reverse());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId, currentLimit]);

  const loadMore = () => {
    setCurrentLimit(prev => prev + initialLimit);
  };

  return { messages, loading, loadMore };
};
