
"use server";

import { adminDb } from './firebase';
import type { DirectMessage, Conversation, User } from './definitions';
import { Timestamp } from 'firebase-admin/firestore';

export async function getConversationsForUser(userId: string): Promise<Conversation[]> {
    try {
        const snapshot = await adminDb.collection('conversations')
            .where('participantIds', 'array-contains', userId)
            .orderBy('lastMessageAt', 'desc')
            .get();
        
        const conversations = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                messages: (data.messages || []).map((msg: any) => ({
                    ...msg,
                    createdAt: msg.createdAt.toDate().toISOString()
                })),
                lastMessageAt: data.lastMessageAt.toDate().toISOString(),
            } as Conversation;
        });

        return JSON.parse(JSON.stringify(conversations));
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return [];
    }
}

export async function addDirectMessage(author: User, recipient: User, text: string): Promise<Conversation | null> {
     try {
        const conversationId = [author.id, recipient.id].sort().join('--');
        const convoRef = adminDb.collection('conversations').doc(conversationId);
        
        const newMessage: Omit<DirectMessage, 'id' | 'createdAt'> = {
            authorId: author.id,
            authorName: author.name,
            recipientId: recipient.id,
            conversationId,
            text,
        };

        const convoDoc = await convoRef.get();

        if (convoDoc.exists) {
            const existingMessages = convoDoc.data()?.messages || [];
            await convoRef.update({
                lastMessageAt: Timestamp.now(),
                messages: [...existingMessages, { ...newMessage, createdAt: Timestamp.now() }]
            });
        } else {
            await convoRef.set({
                id: conversationId,
                participantIds: [author.id, recipient.id],
                participantNames: [author.name, recipient.name],
                lastMessageAt: Timestamp.now(),
                messages: [{ ...newMessage, createdAt: Timestamp.now() }]
            });
        }

        const updatedConvoDoc = await convoRef.get();
        const data = updatedConvoDoc.data();
        if (!data) return null;

        return JSON.parse(JSON.stringify({
            id: updatedConvoDoc.id,
            ...data,
            messages: data.messages.map((m: any) => ({...m, createdAt: m.createdAt.toDate().toISOString()})),
            lastMessageAt: data.lastMessageAt.toDate().toISOString()
        }));

    } catch (error) {
        console.error("Error sending direct message:", error);
        return null;
    }
}

export async function getUsersForMessaging(currentUserId: string): Promise<User[]> {
    try {
        const snapshot = await adminDb.collection('users').get();
        const users = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as User))
            .filter(user => 
                user.id !== currentUserId && 
                (user.role === 'Administrador' || user.role === 'Guardia')
            );
        return JSON.parse(JSON.stringify(users));
    } catch (error) {
        console.error("Error fetching users for messaging:", error);
        return [];
    }
}
