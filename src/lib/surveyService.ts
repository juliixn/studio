
"use client";

import { mockSurveys as initialData } from './data';
import type { Survey } from './definitions';

const STORAGE_KEY = 'surveys-v1';

function getFromStorage(): Survey[] {
    if (typeof window === 'undefined') return initialData;
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored && stored !== 'undefined' && stored !== 'null') return JSON.parse(stored);
    } catch (error) {
        console.error(`Error parsing sessionStorage key "${STORAGE_KEY}":`, error);
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
}

function saveToStorage(surveys: Survey[]) {
    if (typeof window !== 'undefined') {
        const sorted = surveys.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
    }
}

export function getSurveys(condominioId?: string): Survey[] {
    let surveys = getFromStorage();
    if (condominioId) {
        surveys = surveys.filter(s => s.condominioId === 'all' || s.condominioId === condominioId);
    }
    return surveys;
}

export function addSurvey(survey: Omit<Survey, 'id' | 'createdAt' | 'status'>): Survey {
    const surveys = getFromStorage();
    const newSurvey: Survey = {
        ...survey,
        id: `survey-${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'Abierta',
    };
    saveToStorage([newSurvey, ...surveys]);
    return newSurvey;
}

export function updateSurvey(surveyId: string, updates: Partial<Omit<Survey, 'id'>>): Survey | null {
    const surveys = getFromStorage();
    const index = surveys.findIndex(s => s.id === surveyId);
    if (index !== -1) {
        surveys[index] = { ...surveys[index], ...updates };
        saveToStorage(surveys);
        return surveys[index];
    }
    return null;
}

export function deleteSurvey(surveyId: string): boolean {
    const surveys = getFromStorage();
    const newSurveys = surveys.filter(s => s.id !== surveyId);
    if (surveys.length === newSurveys.length) return false;
    saveToStorage(newSurveys);
    return true;
}

export function voteOnSurvey(surveyId: string, optionId: string) {
    const surveys = getFromStorage();
    const surveyIndex = surveys.findIndex(s => s.id === surveyId);
    if (surveyIndex !== -1) {
        const optionIndex = surveys[surveyIndex].options.findIndex(o => o.id === optionId);
        if (optionIndex !== -1) {
            surveys[surveyIndex].options[optionIndex].votes++;
            saveToStorage(surveys);
        }
    }
}
