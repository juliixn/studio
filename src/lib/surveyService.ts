
"use client";

import { createClient } from './supabase/client';
import type { Survey } from './definitions';

export async function getSurveys(condominioId?: string): Promise<Survey[]> {
    const supabase = createClient();
    let query = supabase.from('surveys').select('*');

    if (condominioId) {
        query = query.or(`condominioId.eq.all,condominioId.eq.${condominioId}`);
    }

    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) {
        console.error("Error fetching surveys:", error);
        return [];
    }
    return data as Survey[];
}

export async function addSurvey(surveyData: Omit<Survey, 'id' | 'createdAt' | 'status'>): Promise<Survey | null> {
    const supabase = createClient();
    const newSurveyData = {
        ...surveyData,
        status: 'Abierta',
        createdAt: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('surveys').insert([newSurveyData]).select().single();
    if (error) {
        console.error("Error adding survey:", error);
        return null;
    }
    return data as Survey;
}

export async function updateSurvey(surveyId: string, updates: Partial<Omit<Survey, 'id'>>): Promise<Survey | null> {
    const supabase = createClient();
    const { data, error } = await supabase.from('surveys').update(updates).eq('id', surveyId).select().single();
    if (error) {
        console.error(`Error updating survey ${surveyId}:`, error);
        return null;
    }
    return data as Survey;
}

export async function deleteSurvey(surveyId: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('surveys').delete().eq('id', surveyId);
    if (error) {
        console.error(`Error deleting survey ${surveyId}:`, error);
        return false;
    }
    return true;
}

export async function voteOnSurvey(surveyId: string, optionId: string) {
    const supabase = createClient();
    // This is a complex operation and ideally should be a database function (RPC)
    // for atomicity. For client-side, we'll do a read-then-write.
    
    // 1. Fetch the current survey
    const { data: survey, error: fetchError } = await supabase
        .from('surveys')
        .select('options')
        .eq('id', surveyId)
        .single();
    
    if (fetchError || !survey) {
        console.error("Error fetching survey to vote:", fetchError);
        return;
    }
    
    // 2. Update the vote count
    const updatedOptions = survey.options.map(opt => 
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );
    
    // 3. Write back the updated options
    const { error: updateError } = await supabase
        .from('surveys')
        .update({ options: updatedOptions })
        .eq('id', surveyId);
        
    if (updateError) {
        console.error("Error saving vote:", updateError);
    }
}
