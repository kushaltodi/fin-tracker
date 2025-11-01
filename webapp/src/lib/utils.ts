import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDate(date: string | Date, options: Intl.DateTimeFormatOptions = {}): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(
    new Date(date)
  );
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 1 : 0;
  return (newValue - oldValue) / oldValue;
}

export function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
  let timeout: number;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getAccountTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'Checking': 'bg-blue-100 text-blue-800',
    'Savings': 'bg-green-100 text-green-800',
    'Investment': 'bg-purple-100 text-purple-800',
    'Credit': 'bg-red-100 text-red-800',
    'Loan': 'bg-orange-100 text-orange-800',
    'Cash': 'bg-gray-100 text-gray-800',
    'Bank': 'bg-indigo-100 text-indigo-800',
    'Brokerage': 'bg-pink-100 text-pink-800',
    'Debt': 'bg-red-100 text-red-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

export function getTransactionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'INCOME': 'text-success-600',
    'EXPENSE': 'text-danger-600',
  };
  return colors[type] || 'text-gray-600';
}

export function getCategoryTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'Income': 'bg-success-100 text-success-800',
    'Expense': 'bg-danger-100 text-danger-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function groupTransactionsByDate(transactions: any[]): { date: string; transactions: any[] }[] {
  const grouped = transactions.reduce((groups: Record<string, any[]>, transaction: any) => {
    const date = new Date(transaction.transaction_date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {});

  return Object.keys(grouped)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map(date => ({
      date,
      transactions: grouped[date]
    }));
}