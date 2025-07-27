"use server";

import prisma from './prisma';
import type { DirectMessage, Conversation, User } from './definitions';

export async function getConversationsForUser(userId: string): Promise<Conversation[]> {
    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        id: userId
                    }
                }
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                participants: true,
            },
            orderBy: {
                lastMessageAt: 'desc',
            },
        });

        const processedConversations = conversations.map(convo => ({
            ...convo,
            participantIds: convo.participants.map(p => p.id),
            participantNames: convo.participants.map(p => p.name)
        }))

        return JSON.parse(JSON.stringify(processedConversations));
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
                participantIds: [author.id, recipient.id].join(','),
                participantNames: [author.name, recipient.name].join(','),
                participants: {
                    connect: [{ id: author.id }, { id: recipient.id }]
                },
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
                participants: true,
            }
        });
        
        const processedConversation = {
            ...conversation,
            participantIds: conversation.participants.map(p => p.id),
            participantNames: conversation.participants.map(p => p.name)
        }

        return JSON.parse(JSON.stringify(processedConversation));
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
