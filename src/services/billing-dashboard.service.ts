/**
 * Billing Dashboard Service
 * Handles billing analytics, reports, and payment tracking
 */

import { logger } from './logging.service';
import { offlineStorageManager } from './offline-storage.service';
import {
  timesheetAutomationService,
  TimesheetEntry,
} from './timesheet-automation.service';

export interface BillingPeriod {
  id: string;
  teacherId: string;
  studentId?: string;
  parentId?: string;
  startDate: Date;
  endDate: Date;
  totalHours: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'disputed' | 'cancelled';
  invoiceNumber?: string;
  dueDate?: Date;
  paidDate?: Date;
  paymentMethod?: string;
  notes?: string;
  timesheetEntries: string[]; // Array of timesheet entry IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRecord {
  id: string;
  billingPeriodId: string;
  amount: number;
  currency: string;
  paymentMethod:
    | 'cash'
    | 'check'
    | 'bank_transfer'
    | 'credit_card'
    | 'paypal'
    | 'other';
  transactionId?: string;
  receivedDate: Date;
  processedBy: string;
  notes?: string;
  createdAt: Date;
}

export interface BillingAnalytics {
  totalRevenue: number;
  totalHours: number;
  averageHourlyRate: number;
  pendingAmount: number;
  overdueAmount: number;
  paidAmount: number;
  paymentRate: number; // percentage of invoices paid on time
  revenueByMonth: { month: string; amount: number; hours: number }[];
  revenueByStudent: {
    studentId: string;
    studentName: string;
    amount: number;
    hours: number;
  }[];
  paymentMethodBreakdown: {
    method: string;
    amount: number;
    percentage: number;
  }[];
  statusBreakdown: { status: string; count: number; amount: number }[];
}

export interface BillingReport {
  id: string;
  type:
    | 'summary'
    | 'detailed'
    | 'payment_history'
    | 'tax_report'
    | 'student_breakdown';
  title: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  filters: {
    teacherId?: string;
    studentId?: string;
    parentId?: string;
    status?: BillingPeriod['status'][];
  };
  data: any;
  generatedAt: Date;
  generatedBy: string;
}

export interface TaxCalculation {
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  taxJurisdiction: string;
  exemptions: string[];
}

export class BillingDashboardService {
  private static instance: BillingDashboardService;

  private constructor() {}

  public static getInstance(): BillingDashboardService {
    if (!BillingDashboardService.instance) {
      BillingDashboardService.instance = new BillingDashboardService();
    }
    return BillingDashboardService.instance;
  }

  /**
   * Generate billing period from timesheet entries
   */
  public async generateBillingPeriod(
    teacherId: string,
    startDate: Date,
    endDate: Date,
    options: {
      studentId?: string;
      parentId?: string;
      invoiceNumber?: string;
      dueDate?: Date;
      notes?: string;
    } = {}
  ): Promise<BillingPeriod> {
    try {
      // Get timesheet entries for the period
      const timesheetEntries = await this.getTimesheetEntriesForPeriod(
        teacherId,
        startDate,
        endDate,
        options.studentId
      );

      if (timesheetEntries.length === 0) {
        throw new Error('No timesheet entries found for the specified period');
      }

      // Calculate totals
      const totalHours =
        timesheetEntries.reduce((sum, entry) => {
          return sum + (entry.actualDuration || 0);
        }, 0) / 60; // Convert minutes to hours

      const totalAmount = timesheetEntries.reduce((sum, entry) => {
        return sum + (entry.billing.totalAmount || 0);
      }, 0);

      const currency = timesheetEntries[0]?.billing.currency || 'USD';

      // Create billing period
      const billingPeriod: BillingPeriod = {
        id: this.generateBillingId(),
        teacherId,
        ...(options.studentId !== undefined && {
          studentId: options.studentId,
        }),
        ...(options.parentId !== undefined
          ? { parentId: options.parentId }
          : timesheetEntries[0]?.parentId !== undefined
            ? { parentId: timesheetEntries[0].parentId }
            : {}),
        startDate,
        endDate,
        totalHours,
        totalAmount,
        currency,
        status: 'draft',
        ...(options.invoiceNumber !== undefined
          ? { invoiceNumber: options.invoiceNumber }
          : { invoiceNumber: this.generateInvoiceNumber() }),
        ...(options.dueDate !== undefined
          ? { dueDate: options.dueDate }
          : { dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
        ...(options.notes !== undefined && { notes: options.notes }),
        timesheetEntries: timesheetEntries.map(entry => entry.id),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store billing period
      await offlineStorageManager.store(
        'billingPeriods',
        billingPeriod,
        'medium'
      );

      logger.info('app', 'Billing period generated', {
        id: billingPeriod.id,
        totalHours,
        totalAmount,
      });

      return billingPeriod;
    } catch (error) {
      logger.error(
        'app',
        'Failed to generate billing period',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Get billing analytics for dashboard
   */
  public async getBillingAnalytics(
    teacherId: string,
    period: { startDate: Date; endDate: Date }
  ): Promise<BillingAnalytics> {
    try {
      // Get all billing periods for teacher in the period
      const billingPeriods = await this.getBillingPeriodsForTeacher(
        teacherId,
        period
      );

      // Get payment records
      const paymentRecords = await this.getPaymentRecords(
        billingPeriods.map(bp => bp.id)
      );

      // Calculate analytics
      const analytics: BillingAnalytics = {
        totalRevenue: billingPeriods.reduce(
          (sum, bp) => sum + bp.totalAmount,
          0
        ),
        totalHours: billingPeriods.reduce((sum, bp) => sum + bp.totalHours, 0),
        averageHourlyRate: 0,
        pendingAmount: billingPeriods
          .filter(bp => bp.status === 'sent')
          .reduce((sum, bp) => sum + bp.totalAmount, 0),
        overdueAmount: billingPeriods
          .filter(bp => bp.status === 'overdue')
          .reduce((sum, bp) => sum + bp.totalAmount, 0),
        paidAmount: billingPeriods
          .filter(bp => bp.status === 'paid')
          .reduce((sum, bp) => sum + bp.totalAmount, 0),
        paymentRate: 0,
        revenueByMonth: [],
        revenueByStudent: [],
        paymentMethodBreakdown: [],
        statusBreakdown: [],
      };

      // Calculate average hourly rate
      if (analytics.totalHours > 0) {
        analytics.averageHourlyRate =
          analytics.totalRevenue / analytics.totalHours;
      }

      // Calculate payment rate
      const totalInvoices = billingPeriods.filter(
        bp => bp.status !== 'draft'
      ).length;
      const paidInvoices = billingPeriods.filter(
        bp => bp.status === 'paid'
      ).length;
      if (totalInvoices > 0) {
        analytics.paymentRate = (paidInvoices / totalInvoices) * 100;
      }

      // Revenue by month
      const monthlyRevenue = new Map<
        string,
        { amount: number; hours: number }
      >();
      billingPeriods.forEach(bp => {
        const monthKey = bp.startDate.toISOString().substring(0, 7); // YYYY-MM
        const existing = monthlyRevenue.get(monthKey) || {
          amount: 0,
          hours: 0,
        };
        existing.amount += bp.totalAmount;
        existing.hours += bp.totalHours;
        monthlyRevenue.set(monthKey, existing);
      });

      analytics.revenueByMonth = Array.from(monthlyRevenue.entries()).map(
        ([month, data]) => ({
          month,
          amount: data.amount,
          hours: data.hours,
        })
      );

      // Revenue by student
      const studentRevenue = new Map<
        string,
        { amount: number; hours: number; name: string }
      >();
      billingPeriods.forEach(bp => {
        if (bp.studentId) {
          const existing = studentRevenue.get(bp.studentId) || {
            amount: 0,
            hours: 0,
            name: bp.studentId,
          };
          existing.amount += bp.totalAmount;
          existing.hours += bp.totalHours;
          studentRevenue.set(bp.studentId, existing);
        }
      });

      analytics.revenueByStudent = Array.from(studentRevenue.entries()).map(
        ([studentId, data]) => ({
          studentId,
          studentName: data.name,
          amount: data.amount,
          hours: data.hours,
        })
      );

      // Payment method breakdown
      const paymentMethods = new Map<string, number>();
      paymentRecords.forEach(payment => {
        const existing = paymentMethods.get(payment.paymentMethod) || 0;
        paymentMethods.set(payment.paymentMethod, existing + payment.amount);
      });

      const totalPayments = Array.from(paymentMethods.values()).reduce(
        (sum, amount) => sum + amount,
        0
      );
      analytics.paymentMethodBreakdown = Array.from(
        paymentMethods.entries()
      ).map(([method, amount]) => ({
        method,
        amount,
        percentage: totalPayments > 0 ? (amount / totalPayments) * 100 : 0,
      }));

      // Status breakdown
      const statusCounts = new Map<string, { count: number; amount: number }>();
      billingPeriods.forEach(bp => {
        const existing = statusCounts.get(bp.status) || { count: 0, amount: 0 };
        existing.count++;
        existing.amount += bp.totalAmount;
        statusCounts.set(bp.status, existing);
      });

      analytics.statusBreakdown = Array.from(statusCounts.entries()).map(
        ([status, data]) => ({
          status,
          count: data.count,
          amount: data.amount,
        })
      );

      return analytics;
    } catch (error) {
      logger.error(
        'app',
        'Failed to get billing analytics',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Generate detailed billing report
   */
  public async generateReport(
    type: BillingReport['type'],
    period: { startDate: Date; endDate: Date },
    filters: BillingReport['filters'],
    generatedBy: string
  ): Promise<BillingReport> {
    try {
      let data: any;

      switch (type) {
        case 'summary':
          data = await this.generateSummaryReport(period, filters);
          break;
        case 'detailed':
          data = await this.generateDetailedReport(period, filters);
          break;
        case 'payment_history':
          data = await this.generatePaymentHistoryReport(period, filters);
          break;
        case 'tax_report':
          data = await this.generateTaxReport(period, filters);
          break;
        case 'student_breakdown':
          data = await this.generateStudentBreakdownReport(period, filters);
          break;
        default:
          throw new Error(`Unknown report type: ${type}`);
      }

      const report: BillingReport = {
        id: this.generateReportId(),
        type,
        title: this.getReportTitle(type, period),
        period,
        filters,
        data,
        generatedAt: new Date(),
        generatedBy,
      };

      // Store report
      await offlineStorageManager.store('billingReports', report, 'low');

      logger.info('app', 'Billing report generated', {
        type,
        reportId: report.id,
      });

      return report;
    } catch (error) {
      logger.error(
        'app',
        'Failed to generate billing report',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Record payment for billing period
   */
  public async recordPayment(
    billingPeriodId: string,
    payment: {
      amount: number;
      paymentMethod: PaymentRecord['paymentMethod'];
      transactionId?: string;
      receivedDate: Date;
      processedBy: string;
      notes?: string;
    }
  ): Promise<PaymentRecord> {
    try {
      // Get billing period
      const billingPeriod = await offlineStorageManager.get<BillingPeriod>(
        'billingPeriods',
        billingPeriodId
      );
      if (!billingPeriod) {
        throw new Error('Billing period not found');
      }

      // Create payment record
      const paymentRecord: PaymentRecord = {
        id: this.generatePaymentId(),
        billingPeriodId,
        amount: payment.amount,
        currency: billingPeriod.currency,
        paymentMethod: payment.paymentMethod,
        ...(payment.transactionId !== undefined && {
          transactionId: payment.transactionId,
        }),
        receivedDate: payment.receivedDate,
        processedBy: payment.processedBy,
        ...(payment.notes !== undefined && { notes: payment.notes }),
        createdAt: new Date(),
      };

      // Store payment record
      await offlineStorageManager.store(
        'paymentRecords',
        paymentRecord,
        'medium'
      );

      // Update billing period status if fully paid
      const totalPayments =
        await this.getTotalPaymentsForBillingPeriod(billingPeriodId);
      if (totalPayments + payment.amount >= billingPeriod.totalAmount) {
        billingPeriod.status = 'paid';
        billingPeriod.paidDate = payment.receivedDate;
        billingPeriod.paymentMethod = payment.paymentMethod;
        billingPeriod.updatedAt = new Date();

        await offlineStorageManager.store(
          'billingPeriods',
          billingPeriod,
          'medium'
        );
      }

      logger.info('app', 'Payment recorded', {
        paymentId: paymentRecord.id,
        amount: payment.amount,
        billingPeriodId,
      });

      return paymentRecord;
    } catch (error) {
      logger.error(
        'app',
        'Failed to record payment',
        error instanceof Error ? error : undefined
      );
      throw error;
    }
  }

  /**
   * Calculate tax for billing period
   */
  public calculateTax(
    billingPeriod: BillingPeriod,
    taxRate: number,
    taxJurisdiction: string,
    exemptions: string[] = []
  ): TaxCalculation {
    const subtotal = billingPeriod.totalAmount;
    let taxableAmount = subtotal;

    // Apply exemptions (simplified)
    if (exemptions.includes('education_services')) {
      taxableAmount = 0; // Educational services might be tax-exempt
    }

    const taxAmount = taxableAmount * (taxRate / 100);
    const total = subtotal + taxAmount;

    return {
      subtotal,
      taxRate,
      taxAmount,
      total,
      taxJurisdiction,
      exemptions,
    };
  }

  // Private helper methods

  private async getTimesheetEntriesForPeriod(
    teacherId: string,
    startDate: Date,
    endDate: Date,
    studentId?: string
  ): Promise<TimesheetEntry[]> {
    // This would typically query the timesheet service
    // For now, returning empty array as placeholder
    return [];
  }

  private async getBillingPeriodsForTeacher(
    teacherId: string,
    period: { startDate: Date; endDate: Date }
  ): Promise<BillingPeriod[]> {
    try {
      const allBillingPeriods =
        await offlineStorageManager.getAll<BillingPeriod>('billingPeriods');
      return allBillingPeriods.filter(
        bp =>
          bp.teacherId === teacherId &&
          bp.startDate >= period.startDate &&
          bp.endDate <= period.endDate
      );
    } catch (error) {
      logger.error(
        'app',
        'Failed to get billing periods',
        error instanceof Error ? error : undefined
      );
      return [];
    }
  }

  private async getPaymentRecords(
    billingPeriodIds: string[]
  ): Promise<PaymentRecord[]> {
    try {
      const allPayments =
        await offlineStorageManager.getAll<PaymentRecord>('paymentRecords');
      return allPayments.filter(payment =>
        billingPeriodIds.includes(payment.billingPeriodId)
      );
    } catch (error) {
      logger.error(
        'app',
        'Failed to get payment records',
        error instanceof Error ? error : undefined
      );
      return [];
    }
  }

  private async getTotalPaymentsForBillingPeriod(
    billingPeriodId: string
  ): Promise<number> {
    try {
      const payments = await this.getPaymentRecords([billingPeriodId]);
      return payments.reduce((sum, payment) => sum + payment.amount, 0);
    } catch (error) {
      logger.error(
        'app',
        'Failed to get total payments',
        error instanceof Error ? error : undefined
      );
      return 0;
    }
  }

  private async generateSummaryReport(
    period: { startDate: Date; endDate: Date },
    filters: BillingReport['filters']
  ): Promise<any> {
    // Generate summary report data
    return {
      period,
      totalRevenue: 0,
      totalHours: 0,
      totalInvoices: 0,
      paidInvoices: 0,
      pendingAmount: 0,
      overdueAmount: 0,
    };
  }

  private async generateDetailedReport(
    period: { startDate: Date; endDate: Date },
    filters: BillingReport['filters']
  ): Promise<any> {
    // Generate detailed report data
    return {
      period,
      billingPeriods: [],
      timesheetDetails: [],
      paymentHistory: [],
    };
  }

  private async generatePaymentHistoryReport(
    period: { startDate: Date; endDate: Date },
    filters: BillingReport['filters']
  ): Promise<any> {
    // Generate payment history report
    return {
      period,
      payments: [],
      paymentMethods: [],
      totalReceived: 0,
    };
  }

  private async generateTaxReport(
    period: { startDate: Date; endDate: Date },
    filters: BillingReport['filters']
  ): Promise<any> {
    // Generate tax report
    return {
      period,
      taxableIncome: 0,
      taxOwed: 0,
      exemptions: [],
      quarterlyBreakdown: [],
    };
  }

  private async generateStudentBreakdownReport(
    period: { startDate: Date; endDate: Date },
    filters: BillingReport['filters']
  ): Promise<any> {
    // Generate student breakdown report
    return {
      period,
      students: [],
      averageRates: {},
      topStudents: [],
    };
  }

  private getReportTitle(
    type: BillingReport['type'],
    period: { startDate: Date; endDate: Date }
  ): string {
    const startStr = period.startDate.toISOString().split('T')[0];
    const endStr = period.endDate.toISOString().split('T')[0];

    const titleMap: Record<BillingReport['type'], string> = {
      summary: `Billing Summary Report (${startStr} to ${endStr})`,
      detailed: `Detailed Billing Report (${startStr} to ${endStr})`,
      payment_history: `Payment History Report (${startStr} to ${endStr})`,
      tax_report: `Tax Report (${startStr} to ${endStr})`,
      student_breakdown: `Student Breakdown Report (${startStr} to ${endStr})`,
    };

    return titleMap[type];
  }

  private generateBillingId(): string {
    return `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  private generatePaymentId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateReportId(): string {
    return `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const billingDashboardService = BillingDashboardService.getInstance();
