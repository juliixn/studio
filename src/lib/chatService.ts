
"use server";

import prisma from './prisma';
import type { ChatMessage } from './definitions';

export async function getChatMessages(): Promise<ChatMessage[]> {
    try {
        const messages = await prisma.chatMessage.findMany({
            orderBy: {
                createdAt: 'asc',
            },
        });
        return JSON.parse(JSON.stringify(messages));
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        return [];
    }
}

export async function sendChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage | null> {
    try {
        const newMessage = await prisma.chatMessage.create({
            data: message,
        });
        return JSON.parse(JSON.stringify(newMessage));
    } catch (error) {
        console.error("Error sending chat message:", error);
        return null;
    }
}
