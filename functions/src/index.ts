import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";

admin.initializeApp();

/**
 * Automatically moderates new messages (v2).
 */
export const moderateMessage = onDocumentCreated(
  "rooms/{roomId}/messages/{messageId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) return;

    const messageData = snapshot.data();
    const text = messageData.text;

    if (!text) return;

    // Simple profanity filter example
    const bannedWords = ["badword1", "badword2"];
    const containsBannedWord = bannedWords.some(word =>
      text.toLowerCase().includes(word)
    );

    if (containsBannedWord) {
      logger.info("Moderating message", event.params.messageId);
      await snapshot.ref.update({
        text: "This message was removed due to content moderation.",
        moderated: true,
        originalText: text
      });
    }
  }
);
