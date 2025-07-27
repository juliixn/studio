'use server';
/**
 * @fileOverview An AI agent that analyzes payroll data for anomalies.
 *
 * - analyzePayroll - A function that reviews payroll calculations and flags potential issues.
 * - PayrollAnalysisInput - The input type for the flow.
 * - PayrollAnalysisOutput - The return type for the flow.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GuardPayrollDataSchema = z.object({
  guardName: z.string(),
  daysWorked: z.number(),
  subtotal: z.number(),
  totalBonuses: z.number(),
  totalPenalties: z.number(),
  totalToPay: z.number(),
});

const PayrollAnalysisInputSchema = z.object({
  payrollPeriod: z.string().describe('The date range for the payroll, e.g., "1-15 Agosto 2024".'),
  guardsData: z.array(GuardPayrollDataSchema),
});
export type PayrollAnalysisInput = z.infer<typeof PayrollAnalysisInputSchema>;

const AnomalySchema = z.object({
  guardName: z.string().describe('The name of the guard associated with the anomaly.'),
  anomalyDescription: z
    .string()
    .describe('A clear and concise description of the potential issue found.'),
  severity: z
    .enum(['Warning', 'Critical'])
    .describe('The severity of the anomaly.'),
});

const PayrollAnalysisOutputSchema = z.object({
  anomalies: z.array(AnomalySchema).describe('A list of all detected anomalies. If none, return an empty array.'),
  overallStatus: z.enum(['Aprobado', 'Revisión Requerida']).describe('Overall status of the payroll analysis.'),
});
export type PayrollAnalysisOutput = z.infer<typeof PayrollAnalysisOutputSchema>;

export async function analyzePayroll(input: PayrollAnalysisInput): Promise<PayrollAnalysisOutput> {
  return analyzePayrollFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePayrollPrompt',
  input: {schema: PayrollAnalysisInputSchema},
  output: {schema: PayrollAnalysisOutputSchema},
  prompt: `You are an expert payroll auditor for a security company. Your task is to analyze the following payroll data for the period of {{payrollPeriod}} and identify any potential anomalies.

Common anomalies to look for:
-   A total payment that is significantly higher than usual (e.g., >$8,000 for a 15-day period).
-   Bonuses that exceed the subtotal salary.
-   A negative total payment amount.
-   A guard with 0 days worked but receiving payment.

Review the data for each guard. For every anomaly you find, create an entry in the "anomalies" array. If no anomalies are found, return an empty array for "anomalies" and set "overallStatus" to "Aprobado".

Payroll Data:
{{#each guardsData}}
-   **Guard:** {{guardName}}
    -   Days Worked: {{daysWorked}}
    -   Subtotal: \${{subtotal}}
    -   Bonuses: \${{totalBonuses}}
    -   Penalties: \${{totalPenalties}}
    -   **Total to Pay:** \${{totalToPay}}
{{/each}}

Analyze the data and produce the output in the specified JSON format.`,
});

const analyzePayrollFlow = ai.defineFlow(
  {
    name: 'analyzePayrollFlow',
    inputSchema: PayrollAnalysisInputSchema,
    outputSchema: PayrollAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
