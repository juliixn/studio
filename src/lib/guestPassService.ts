
"use server";

import prisma from './prisma';
import type { GuestPass } from './definitions';
import { addDays, addMonths, addYears, isAfter } from 'date-fns';

export async function getGuestPasses(condominioId?: string, residentId?: string): Promise<GuestPass[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }
        if (residentId) {
            whereClause.residentId = residentId;
        }
        const passes = await prisma.guestPass.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
        });
        return JSON.parse(JSON.stringify(passes));
    } catch (error) {
        console.error("Error fetching guest passes:", error);
        return [];
    }
}

export async function getGuestPassById(passId: string): Promise<GuestPass | null> {
    try {
        const pass = await prisma.guestPass.findUnique({
            where: { id: passId },
        });
        
        if (!pass) return null;

        if (pass.passType === 'temporal' && pass.validUntil && isAfter(new Date(), new Date(pass.validUntil))) {
            // Pass has expired
            return null;
        }
        
        return JSON.parse(JSON.stringify(pass));
    } catch (error) {
        console.error(`Error fetching guest pass ${passId}:`, error);
        return null;
    }
}

type AddPassPayload = Omit<GuestPass, 'id' | 'createdAt' | 'validUntil'> & {
    durationValue?: number;
    durationUnit?: 'days' | 'months' | 'years';
};

export async function addGuestPass(payload: AddPassPayload): Promise<GuestPass | null> {
    try {
        let validUntil: string | null = null;
        if (payload.passType === 'temporal' && payload.durationValue && payload.durationUnit) {
            const now = new Date();
            switch (payload.durationUnit) {
                case 'days':
                    validUntil = addDays(now, payload.durationValue).toISOString();
                    break;
                case 'months':
                    validUntil = addMonths(now, payload.durationValue).toISOString();
                    break;
                case 'years':
                    validUntil = addYears(now, payload.durationValue).toISOString();
                    break;
            }
        }
        
        const { durationValue, durationUnit, ...restOfPayload } = payload;
        
        const newPass = await prisma.guestPass.create({
            data: {
                ...restOfPayload,
                validUntil,
            },
        });
        return JSON.parse(JSON.stringify(newPass));
    } catch (error) {
        console.error("Error adding guest pass:", error);
        return null;
    }
}

export async function deleteGuestPass(passId: string): Promise<boolean> {
    try {
        await prisma.guestPass.delete({
            where: { id: passId },
        });
        return true;
    } catch (error) {
        console.error(`Error deleting guest pass ${passId}:`, error);
        return false;
    }
}
