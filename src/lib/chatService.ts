
"use server";

import { adminDb } from './firebase';
import type { ChatMessage } from './definitions';
import { Timestamp } from 'firebase-admin/firestore';

export async function getChatMessages(): Promise<ChatMessage[]> {
    try {
        const snapshot = await adminDb.collection('chatMessages').orderBy('createdAt', 'asc').get();
        const messages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt.toDate().toISOString(),
            } as ChatMessage;
        });
        return JSON.parse(JSON.stringify(messages));
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        return [];
    }
}

export async function sendChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage | null> {
    try {
        const newDocRef = adminDb.collection('chatMessages').doc();
        const newMessageData = {
            id: newDocRef.id,
            ...message,
            createdAt: Timestamp.now(),
        };
        await newDocRef.set(newMessageData);
        return JSON.parse(JSON.stringify({
            ...newMessageData,
            createdAt: newMessageData.createdAt.toDate().toISOString(),
        }));
    } catch (error) {
        console.error("Error sending chat message:", error);
        return null;
    }
}
