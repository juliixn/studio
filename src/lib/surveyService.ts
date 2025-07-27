
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
        return JSON.parse(JSON.stringify(surveys));
    } catch (error) {
        console.error("Error fetching surveys:", error);
        return [];
    }
}

export async function addSurvey(survey: Omit<Survey, 'id' | 'createdAt' | 'status'>): Promise<Survey | null> {
    try {
        const newSurvey = await prisma.survey.create({
            data: {
                ...survey,
                status: 'Abierta',
            },
        });
        return JSON.parse(JSON.stringify(newSurvey));
    } catch (error) {
        console.error("Error adding survey:", error);
        return null;
    }
}

export async function updateSurvey(surveyId: string, updates: Partial<Omit<Survey, 'id' | 'options'>> & { options?: SurveyOption[] }): Promise<Survey | null> {
    try {
        const { options, ...restOfUpdates } = updates;
        const updatedSurvey = await prisma.survey.update({
            where: { id: surveyId },
            data: {
                ...restOfUpdates,
                ...(options && { options: options }),
            },
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
        if (!survey) return false;

        const options = survey.options as SurveyOption[];
        const optionIndex = options.findIndex(o => o.id === optionId);
        
        if (optionIndex !== -1) {
            options[optionIndex].votes++;
            await prisma.survey.update({
                where: { id: surveyId },
                data: { options: options },
            });
            return true;
        }
        return false;
    } catch (error) {
        console.error(`Error voting on survey ${surveyId}:`, error);
        return false;
    }
}
