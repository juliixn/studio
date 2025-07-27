
"use server";

import prisma from './prisma';
import type { ArchivedPayroll, Loan, LoanStatus } from './definitions';

export async function getArchivedPayrolls(): Promise<ArchivedPayroll[]> {
    try {
        const payrolls = await prisma.archivedPayroll.findMany({
            orderBy: { archivedAt: 'desc' },
        });
        return JSON.parse(JSON.stringify(payrolls));
    } catch (error) {
        console.error("Error fetching archived payrolls:", error);
        return [];
    }
}

export async function archivePayroll(payroll: Omit<ArchivedPayroll, 'id' | 'archivedAt'>): Promise<ArchivedPayroll | null> {
    try {
        const newArchive = await prisma.archivedPayroll.create({
            data: {
                periodFrom: payroll.period.from,
                periodTo: payroll.period.to,
                payrollData: payroll.payrollData,
                totals: payroll.totals,
            },
        });
        return JSON.parse(JSON.stringify(newArchive));
    } catch (error) {
        console.error("Error archiving payroll:", error);
        return null;
    }
}

export async function getLoans(guardId?: string): Promise<Loan[]> {
    try {
        const whereClause: any = {};
        if (guardId) {
            whereClause.guardId = guardId;
        }
        const loans = await prisma.loan.findMany({
            where: whereClause,
            orderBy: { requestedAt: 'desc' }
        });
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
        const newLoan = await prisma.loan.create({
            data: {
                ...payload,
                totalOwed,
                balance: totalOwed,
                status: 'Pendiente',
                payments: [],
            },
        });
        return JSON.parse(JSON.stringify(newLoan));
    } catch (error) {
        console.error("Error requesting loan:", error);
        return null;
    }
}

export async function updateLoanStatus(loanId: string, status: LoanStatus): Promise<Loan | null> {
    try {
        const updates: any = { status };
        if (status === 'Aprobado') {
            updates.approvedAt = new Date().toISOString();
        }
        const updatedLoan = await prisma.loan.update({
            where: { id: loanId },
            data: updates,
        });
        return JSON.parse(JSON.stringify(updatedLoan));
    } catch (error) {
        console.error("Error updating loan status:", error);
        return null;
    }
}

export async function applyPayrollDeductions(payrollId: string, deductions: { guardId: string, amount: number }[]) {
    for (const deduction of deductions) {
        const loan = await prisma.loan.findFirst({
            where: {
                guardId: deduction.guardId,
                status: 'Aprobado',
            }
        });

        if (loan) {
            const paymentAmount = Math.min(loan.balance, deduction.amount);
            if (paymentAmount > 0) {
                const newBalance = loan.balance - paymentAmount;
                const newStatus = newBalance <= 0 ? 'Pagado' : 'Aprobado';
                const newPayments = [...(loan.payments as any[] || []), { payrollId, amount: paymentAmount, date: new Date().toISOString() }];

                await prisma.loan.update({
                    where: { id: loan.id },
                    data: { balance: newBalance, status: newStatus, payments: newPayments },
                });
            }
        }
    }
}
