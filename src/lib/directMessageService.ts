"use server";

import prisma from './prisma';
import type { DirectMessage, Conversation, User } from './definitions';

export async function getConversationsForUser(userId: string): Promise<Conversation[]> {
    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                participantIds: {
                    has: userId
                }
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
            orderBy: {
                lastMessageAt: 'desc',
            },
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

        const conversation = await prisma.conversation.upsert({
            where: { id: conversationId },
            update: { 
                lastMessageAt: new Date(),
                messages: {
                    create: {
                        authorId: author.id,
                        authorName: author.name,
                        recipientId: recipient.id,
                        text,
                    }
                }
            },
            create: {
                id: conversationId,
                participantIds: [author.id, recipient.id],
                participantNames: [author.name, recipient.name],
                messages: {
                    create: {
                        authorId: author.id,
                        authorName: author.name,
                        recipientId: recipient.id,
                        text,
                    }
                }
            },
            include: {
                messages: true,
            }
        });
        
        return JSON.parse(JSON.stringify(conversation));
    } catch (error) {
        console.error("Error sending direct message:", error);
        return null;
    }
}

export async function getUsersForMessaging(currentUserId: string): Promise<User[]> {
    try {
        const users = await prisma.user.findMany({
            where: {
                id: { not: currentUserId },
                OR: [
                    { role: 'Administrador' },
                    { role: 'Guardia' },
                ],
            },
        });
        return JSON.parse(JSON.stringify(users));
    } catch (error) {
        console.error("Error fetching users for messaging:", error);
        return [];
    }
}
