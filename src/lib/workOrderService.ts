
"use server";

import prisma from './prisma';
import type { WorkOrder } from './definitions';

export async function getWorkOrders(condominioId?: string): Promise<WorkOrder[]> {
    try {
        const whereClause: any = {};
        if (condominioId) {
            whereClause.condominioId = condominioId;
        }
        const workOrders = await prisma.workOrder.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
        return JSON.parse(JSON.stringify(workOrders));
    } catch (error) {
        console.error("Error fetching work orders:", error);
        return [];
    }
}

export async function addWorkOrder(orderData: Omit<WorkOrder, 'id' | 'createdAt'>): Promise<WorkOrder | null> {
    try {
        const newOrder = await prisma.workOrder.create({
            data: orderData as any,
        });
        return JSON.parse(JSON.stringify(newOrder));
    } catch (error) {
        console.error("Error adding work order:", error);
        return null;
    }
}

export async function updateWorkOrder(orderId: string, updates: Partial<Omit<WorkOrder, 'id'>>): Promise<WorkOrder | null> {
    try {
        if (updates.status === 'Completada' && !updates.completedAt) {
            updates.completedAt = new Date().toISOString();
        }
        const updatedOrder = await prisma.workOrder.update({
            where: { id: orderId },
            data: updates,
        });
        return JSON.parse(JSON.stringify(updatedOrder));
    } catch (error) {
        console.error(`Error updating work order ${orderId}:`, error);
        return null;
    }
}

export async function deleteWorkOrder(orderId: string): Promise<boolean> {
    try {
        await prisma.workOrder.delete({
            where: { id: orderId },
        });
        return true;
    } catch (error) {
        console.error(`Error deleting work order ${orderId}:`, error);
        return false;
    }
}
