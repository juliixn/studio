
"use server";

import prisma from './prisma';
import type { Survey, SurveyOption } from './definitions';

export async function getSurveys(condominioId?: string): Promise<Survey[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.OR = [
                { condominioId: 'all' },
                { condominioId: condominioId }
            ];
        }

        const surveys = await prisma.survey.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });
        
        const processedSurveys = surveys.map(s => ({
            ...s,
            options: s.options ? JSON.parse(s.options as string) : []
        }));
        
        return JSON.parse(JSON.stringify(processedSurveys));
    } catch (error) {
        console.error("Error fetching surveys:", error);
        return [];
    }
}

export async function addSurvey(survey: Omit<Survey, 'id' | 'createdAt' | 'status' | 'options'> & { options: {text: string}[] }): Promise<Survey | null> {
    try {
        const optionsWithVotes: SurveyOption[] = survey.options.map((opt, index) => ({
            id: `opt-${Date.now()}-${index}`,
            text: opt.text,
            votes: 0,
        }));

        const dataToSave = {
            ...survey,
            options: JSON.stringify(optionsWithVotes),
            status: 'Abierta',
        }
        const newSurvey = await prisma.survey.create({
            data: dataToSave,
        });
        return JSON.parse(JSON.stringify(newSurvey));
    } catch (error) {
        console.error("Error adding survey:", error);
        return null;
    }
}

export async function updateSurvey(surveyId: string, updates: Partial<Omit<Survey, 'id' | 'options'> & { options: {text: string}[] }>): Promise<Survey | null> {
    try {
        const dataToUpdate: any = { ...updates };
        if (updates.options) {
             const optionsWithVotes: SurveyOption[] = updates.options.map((opt, index) => ({
                id: `opt-${Date.now()}-${index}`,
                text: opt.text,
                votes: 0,
            }));
            dataToUpdate.options = JSON.stringify(optionsWithVotes);
        }
       
        const updatedSurvey = await prisma.survey.update({
            where: { id: surveyId },
            data: dataToUpdate,
        });
        return JSON.parse(JSON.stringify(updatedSurvey));
    } catch (error) {
        console.error(`Error updating survey ${surveyId}:`, error);
        return null;
    }
}

export async function deleteSurvey(surveyId: string): Promise<boolean> {
    try {
        await prisma.survey.delete({
            where: { id: surveyId },
        });
        return true;
    } catch (error) {
        console.error(`Error deleting survey ${surveyId}:`, error);
        return false;
    }
}

export async function voteOnSurvey(surveyId: string, optionId: string): Promise<boolean> {
    try {
        const survey = await prisma.survey.findUnique({ where: { id: surveyId } });
        if (!survey || !survey.options) return false;

        const options = JSON.parse(survey.options as string) as SurveyOption[];
        const optionIndex = options.findIndex(o => o.id === optionId);
        
        if (optionIndex !== -1) {
            options[optionIndex].votes++;
            await prisma.survey.update({
                where: { id: surveyId },
                data: { options: JSON.stringify(options) },
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error voting on survey ${surveyId}:`, error);
        return false;
    }
}
