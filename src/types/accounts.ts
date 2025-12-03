// ============================================
// BANK (Banka)
// ============================================
export interface Bank {
  id: string;
  name: string;
  shortName: string; // Zkratka (ČS, RB, KB...)
  color: string;
  logo?: string;
  notes?: string;
}

// ============================================
// BANK ACCOUNT (Bankovní účet)
// ============================================
export type AccountType = "checking" | "savings" | "mortgage" | "premium";

export interface BankAccount {
  id: string;
  bankId: string;
  ownerId?: string; // ID člena domácnosti, null = společný
  name: string;
  accountNumber?: string; // Číslo účtu
  type: AccountType;
  isPremium: boolean; // Prémiový účet s podmínkami?
  premiumMinFlow?: number; // Minimální měsíční obrat pro prémium
  color?: string;
  notes?: string;
}

// ============================================
// SCHEDULED TRANSFER (Naplánovaný převod)
// ============================================
export interface ScheduledTransfer {
  id: string;
  name: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  dayOfMonth: number; // Den v měsíci (1-31)
  description?: string;
  isActive: boolean;
  // Pro vizualizaci
  order: number; // Pořadí v workflow
  category?: "income" | "internal" | "expense" | "savings";
}

// ============================================
// MONEY FLOW SUMMARY
// ============================================
export interface AccountFlowSummary {
  accountId: string;
  accountName: string;
  bankName: string;
  incomingTotal: number;
  outgoingTotal: number;
  netFlow: number;
  transfers: {
    incoming: ScheduledTransfer[];
    outgoing: ScheduledTransfer[];
  };
}

// ============================================
// CONSTANTS
// ============================================
export const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: "checking", label: "Běžný účet", icon: "💳" },
  { value: "savings", label: "Spořicí účet", icon: "🏦" },
  { value: "mortgage", label: "Hypoteční účet", icon: "🏠" },
  { value: "premium", label: "Prémiový účet", icon: "⭐" },
];

export const COMMON_BANKS: { name: string; shortName: string; color: string }[] = [
  { name: "Česká spořitelna", shortName: "ČS", color: "#0066b3" },
  { name: "Komerční banka", shortName: "KB", color: "#cc0000" },
  { name: "ČSOB", shortName: "ČSOB", color: "#003366" },
  { name: "Raiffeisenbank", shortName: "RB", color: "#ffcc00" },
  { name: "mBank", shortName: "mBank", color: "#009ee0" },
  { name: "Fio banka", shortName: "Fio", color: "#2fa13e" },
  { name: "Air Bank", shortName: "Air", color: "#6dc067" },
  { name: "Moneta", shortName: "Moneta", color: "#0072bc" },
  { name: "UniCredit Bank", shortName: "UCB", color: "#e2001a" },
  { name: "Creditas", shortName: "Creditas", color: "#00a0e3" },
];

