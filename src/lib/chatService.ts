
"use client";

import { createClient } from './supabase/client';
import type { ChatMessage } from './definitions';

export async function getChatMessages(): Promise<ChatMessage[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('guard_chat_messages')
        .select('*')
        .order('createdAt', { ascending: true });
        
    if (error) {
        console.error("Error fetching chat messages:", error);
        return [];
    }
    return data as ChatMessage[];
}

export async function sendChatMessage(message: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('guard_chat_messages')
        .insert([{ ...message }])
        .select()
        .single();
    
    if (error) {
        console.error("Error sending chat message:", error);
        return null;
    }
    return data as ChatMessage;
}
