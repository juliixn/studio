
"use client";

import { createClient } from './supabase/client';
import type { DirectMessage, Conversation, User } from './definitions';

export async function getConversationsForUser(userId: string): Promise<Conversation[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('conversations')
        .select(`*, messages:direct_messages(*)`)
        .or(`participant_ids.cs.{"${userId}"}`)
        .order('lastMessageAt', { ascending: false });

    if (error) {
        console.error("Error fetching conversations:", error);
        return [];
    }
    return data.map(convo => ({
        ...convo,
        messages: convo.messages.sort((a: DirectMessage, b: DirectMessage) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    })) as Conversation[];
}

function getConversationId(userId1: string, userId2: string): string {
    return [userId1, userId2].sort().join('--');
}

export async function addDirectMessage(author: User, recipient: User, text: string): Promise<Conversation | null> {
    const supabase = createClient();
    const conversationId = getConversationId(author.id, recipient.id);

    const { error: msgError } = await supabase.from('direct_messages').insert([{
        conversationId,
        authorId: author.id,
        authorName: author.name,
        text,
    }]);

    if (msgError) {
        console.error("Error sending direct message:", msgError);
        return null;
    }
    
    // Upsert conversation to create or update last message time
    const { data: convoData, error: convoError } = await supabase.from('conversations').upsert({
        id: conversationId,
        participant_ids: [author.id, recipient.id],
        participant_names: [author.name, recipient.name],
        lastMessageAt: new Date().toISOString(),
    }, { onConflict: 'id' }).select().single();

    if (convoError) {
        console.error("Error upserting conversation:", convoError);
        return null;
    }
    
    return convoData as Conversation;
}

export async function getUsersForMessaging(currentUserId: string): Promise<User[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'eq', currentUserId)
        .or('role.eq.Administrador,role.eq.Guardia'); // Example: only message admins and guards

    if (error) {
        console.error("Error fetching users for messaging:", error);
        return [];
    }
    return data as User[];
}
