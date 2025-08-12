
"use server";

import { adminDb } from './firebase';
import type { Survey, SurveyOption } from './definitions';

export async function getSurveys(condominioId?: string): Promise<Survey[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('surveys');
        
        const snapshot = await query.orderBy('createdAt', 'desc').get();
        const surveys = snapshot.docs.map(s => ({
            id: s.id,
            ...s.data(),
        } as Survey));

        const filtered = condominioId ? surveys.filter(s => s.condominioId === 'all' || s.condominioId === condominioId) : surveys;
        
        return JSON.parse(JSON.stringify(filtered));
    } catch (error) {
        console.error("Error fetching surveys:", error);
        return [];
    }
}

export async function addSurvey(survey: Omit<Survey, 'id' | 'createdAt' | 'status' | 'options'> & { options: {text: string}[] }): Promise<Survey | null> {
    try {
        const newDocRef = adminDb.collection('surveys').doc();
        const optionsWithVotes: SurveyOption[] = survey.options.map((opt, index) => ({
            id: `opt-${Date.now()}-${index}`,
            text: opt.text,
            votes: 0,
        }));

        const dataToSave = {
            id: newDocRef.id,
            ...survey,
            options: optionsWithVotes,
            status: 'Abierta',
            createdAt: new Date().toISOString(),
        } as Omit<Survey, 'options'> & { options: SurveyOption[] };

        await newDocRef.set(dataToSave);
        return JSON.parse(JSON.stringify(dataToSave));
    } catch (error) {
        console.error("Error adding survey:", error);
        return null;
    }
}

export async function updateSurvey(surveyId: string, updates: Partial<Omit<Survey, 'id' | 'options'> & { options: {text: string}[] }>): Promise<Survey | null> {
    try {
        const docRef = adminDb.collection('surveys').doc(surveyId);
        const dataToUpdate: any = { ...updates };
        if (updates.options) {
             const optionsWithVotes: SurveyOption[] = updates.options.map((opt, index) => ({
                id: `opt-${Date.now()}-${index}`,
                text: opt.text,
                votes: 0,
            }));
            dataToUpdate.options = optionsWithVotes;
        }
       
        await docRef.update(dataToUpdate);
        const updatedDoc = await docRef.get();
        return JSON.parse(JSON.stringify({ id: updatedDoc.id, ...updatedDoc.data() }));
    } catch (error) {
        console.error(`Error updating survey ${surveyId}:`, error);
        return null;
    }
}

export async function deleteSurvey(surveyId: string): Promise<boolean> {
    try {
        await adminDb.collection('surveys').doc(surveyId).delete();
        return true;
    } catch (error) {
        console.error(`Error deleting survey ${surveyId}:`, error);
        return false;
    }
}

export async function voteOnSurvey(surveyId: string, optionId: string): Promise<boolean> {
    try {
        const docRef = adminDb.collection('surveys').doc(surveyId);
        const surveyDoc = await docRef.get();
        
        if (!surveyDoc.exists) return false;
        
        const survey = surveyDoc.data() as Survey;
        const options = survey.options;
        const optionIndex = options.findIndex(o => o.id === optionId);
        
        if (optionIndex !== -1) {
            options[optionIndex].votes++;
            await docRef.update({ options: options });
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error voting on survey ${surveyId}:`, error);
        return false;
    }
}
