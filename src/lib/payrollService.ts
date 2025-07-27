
"use client";

import { createClient } from './supabase/client';
import type { ArchivedPayroll, Loan, LoanStatus } from './definitions';

export async function getArchivedPayrolls(): Promise<ArchivedPayroll[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('archived_payrolls')
        .select('*')
        .order('archivedAt', { ascending: false });
        
    if (error) {
        console.error("Error fetching archived payrolls:", error);
        return [];
    }
    return data;
}

export async function archivePayroll(payroll: Omit<ArchivedPayroll, 'id' | 'archivedAt'>): Promise<ArchivedPayroll | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('archived_payrolls')
        .insert([{ ...payroll, archivedAt: new Date().toISOString() }])
        .select()
        .single();
    
    if (error) {
        console.error("Error archiving payroll:", error);
        return null;
    }
    return data;
}

export async function getLoans(guardId?: string): Promise<Loan[]> {
    const supabase = createClient();
    let query = supabase.from('loans').select('*');
    if (guardId) {
        query = query.eq('guardId', guardId);
    }
    const { data, error } = await query.order('requestedAt', { ascending: false });

    if (error) {
        console.error("Error fetching loans:", error);
        return [];
    }
    return data;
}

type LoanRequestPayload = Omit<Loan, 'id' | 'totalOwed' | 'balance' | 'status' | 'requestedAt' | 'payments' | 'approvedAt'>;

export async function requestLoan(payload: LoanRequestPayload): Promise<Loan | null> {
    const supabase = createClient();
    const totalOwed = payload.amount * (1 + (payload.interestRate || 0) / 100);
    const newLoanData = {
        ...payload,
        totalOwed,
        balance: totalOwed,
        status: 'Pendiente' as LoanStatus,
        payments: [],
    };
    
    const { data, error } = await supabase.from('loans').insert([newLoanData]).select().single();
    if (error) {
        console.error("Error requesting loan:", error);
        return null;
    }
    return data;
}

export async function updateLoanStatus(loanId: string, status: LoanStatus): Promise<Loan | null> {
    const supabase = createClient();
    const updates: Partial<Loan> = { status };
    if (status === 'Aprobado') {
        updates.approvedAt = new Date().toISOString();
    }
    const { data, error } = await supabase.from('loans').update(updates).eq('id', loanId).select().single();
    if (error) {
        console.error("Error updating loan status:", error);
        return null;
    }
    return data;
}

export async function applyPayrollDeductions(payrollId: string, deductions: { guardId: string, amount: number }[]) {
    const supabase = createClient();
    for (const deduction of deductions) {
        const { data: loan } = await supabase
            .from('loans')
            .select('*')
            .eq('guardId', deduction.guardId)
            .eq('status', 'Aprobado')
            .single();

        if (loan) {
            const paymentAmount = Math.min(loan.balance, deduction.amount);
            if (paymentAmount > 0) {
                const newBalance = loan.balance - paymentAmount;
                const newStatus = newBalance <= 0 ? 'Pagado' : 'Aprobado';
                const newPayments = [...(loan.payments || []), { payrollId, amount: paymentAmount, date: new Date().toISOString() }];

                await supabase
                    .from('loans')
                    .update({ balance: newBalance, status: newStatus, payments: newPayments })
                    .eq('id', loan.id);
            }
        }
    }
}
