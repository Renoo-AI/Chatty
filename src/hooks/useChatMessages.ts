import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData
} from 'firebase/firestore';
import { db } from '../services/firebase/config';
import type { Message } from '../types/chat';

const CHAT_LIMIT = 25;

export const useChatMessages = (roomId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Real-time listener for the latest messages
  useEffect(() => {
    if (!roomId) return;

    setLoading(true);
    const messagesRef = collection(db, 'rooms', roomId, 'messages');
    const q = query(
      messagesRef,
      orderBy('createdAt', 'desc'),
      limit(CHAT_LIMIT)
    );

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];

      // When the listener first fires, set the anchor for pagination
      if (snapshot.docs.length > 0 && !lastVisible) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }

      // Update messages. We merge with existing historical messages if any.
      setMessages(prev => {
        // Find messages in prev that are older than the ones in fetchedMessages
        // In this implementation, we simply take the latest ones from snapshot
        // and keep the ones that were loaded via loadMore.
        const historical = prev.filter(p => !fetchedMessages.find(f => f.id === p.id));
        const combined = [...fetchedMessages, ...historical];
        // Sort combined to ensure order (newest first)
        return combined.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
      });

      setLoading(false);
    });

    return () => {
      unsubscribe();
      setMessages([]);
      setLastVisible(null);
      setHasMore(true);
    };
  }, [roomId]);

  const loadMore = useCallback(async () => {
    if (!lastVisible || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const messagesRef = collection(db, 'rooms', roomId, 'messages');
      const q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(CHAT_LIMIT)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        setHasMore(false);
      } else {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];

        setMessages(prev => [...prev, ...newMessages]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (err) {
      console.error("Error loading more messages:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [roomId, lastVisible, loadingMore, hasMore]);

  // For the UI, we want oldest first (chronological)
  const displayMessages = [...messages].reverse();

  return { messages: displayMessages, loading, loadingMore, loadMore, hasMore };
};
