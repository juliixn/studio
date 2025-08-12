
"use server";

import { adminDb } from './firebase';
import type { ArchivedPayroll, Loan, LoanStatus, PayrollData } from './definitions';
import { Timestamp } from 'firebase-admin/firestore';

export async function getArchivedPayrolls(): Promise<ArchivedPayroll[]> {
    try {
        const snapshot = await adminDb.collection('archivedPayrolls').orderBy('archivedAt', 'desc').get();

        const payrolls = snapshot.docs.map(p => {
            const data = p.data();
            return {
                ...data,
                id: p.id,
                archivedAt: data.archivedAt.toDate().toISOString(),
            } as ArchivedPayroll
        });
        
        return JSON.parse(JSON.stringify(payrolls));
    } catch (error) {
        console.error("Error fetching archived payrolls:", error);
        return [];
    }
}

export async function archivePayroll(payroll: Omit<ArchivedPayroll, 'id' | 'archivedAt'>): Promise<ArchivedPayroll | null> {
    try {
        const newDocRef = adminDb.collection('archivedPayrolls').doc();
        const newArchive = {
            id: newDocRef.id,
            ...payroll,
            archivedAt: Timestamp.now(),
        };
        await newDocRef.set(newArchive);
        return JSON.parse(JSON.stringify({
            ...newArchive,
            archivedAt: newArchive.archivedAt.toDate().toISOString(),
        }));
    } catch (error) {
        console.error("Error archiving payroll:", error);
        return null;
    }
}

export async function getLoans(guardId?: string): Promise<Loan[]> {
    try {
        let query: FirebaseFirestore.Query = adminDb.collection('loans');
        if (guardId) {
            query = query.where('guardId', '==', guardId);
        }
        const snapshot = await query.orderBy('requestedAt', 'desc').get();
        const loans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan));
        return JSON.parse(JSON.stringify(loans));
    } catch (error) {
        console.error("Error fetching loans:", error);
        return [];
    }
}

type LoanRequestPayload = Omit<Loan, 'id' | 'totalOwed' | 'balance' | 'status' | 'requestedAt' | 'payments' | 'approvedAt'>;

export async function requestLoan(payload: LoanRequestPayload): Promise<Loan | null> {
    try {
        const totalOwed = payload.amount * (1 + (payload.interestRate || 0) / 100);
        const newDocRef = adminDb.collection('loans').doc();
        const newLoan = {
            id: newDocRef.id,
            ...payload,
            totalOwed,
            balance: totalOwed,
            status: 'Pendiente',
            payments: '[]',
            requestedAt: new Date().toISOString()
        };
        await newDocRef.set(newLoan);
        return JSON.parse(JSON.stringify(newLoan));
    } catch (error) {
        console.error("Error requesting loan:", error);
        return null;
    }
}

export async function updateLoanStatus(loanId: string, status: LoanStatus): Promise<Loan | null> {
    try {
        const docRef = adminDb.collection('loans').doc(loanId);
        const updates: any = { status };
        if (status === 'Aprobado') {
            updates.approvedAt = new Date().toISOString();
        }
        await docRef.update(updates);
        const updatedDoc = await docRef.get();
        return JSON.parse(JSON.stringify({ id: updatedDoc.id, ...updatedDoc.data() }));
    } catch (error) {
        console.error("Error updating loan status:", error);
        return null;
    }
}

export async function applyPayrollDeductions(payrollId: string, deductions: { guardId: string, amount: number }[]) {
    for (const deduction of deductions) {
        const snapshot = await adminDb.collection('loans')
            .where('guardId', '==', deduction.guardId)
            .where('status', '==', 'Aprobado')
            .limit(1)
            .get();

        if (!snapshot.empty) {
            const loanDoc = snapshot.docs[0];
            const loan = loanDoc.data() as Loan;
            
            const paymentAmount = Math.min(loan.balance, deduction.amount);
            if (paymentAmount > 0) {
                const newBalance = loan.balance - paymentAmount;
                const newStatus = newBalance <= 0 ? 'Pagado' : 'Aprobado';
                const currentPayments = JSON.parse(loan.payments || '[]');
                const newPayments = [...currentPayments, { payrollId, amount: paymentAmount, date: new Date().toISOString() }];

                await loanDoc.ref.update({ balance: newBalance, status: newStatus, payments: JSON.stringify(newPayments) });
            }
        }
    }
}
