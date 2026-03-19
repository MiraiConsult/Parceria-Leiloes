import { Lancamento } from "../types";

export const formatCurrency = (valueInCents: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInCents / 100);
};

export const formatDate = (dateString: string) => {
  if (!dateString) return '';
  
  // Use the robust parseDate function to handle 'YYYY-MM-DD' strings safely
  // and avoid timezone pitfalls with `new Date(string)`.
  const date = parseDate(dateString);

  if (isNaN(date.getTime())) {
    return ''; // Invalid date
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

export const parseDateToISO = (dateInput: string | number | Date): string => {
    if (!dateInput) return "";

    // Case 1: Input is already a JavaScript Date object
    if (dateInput instanceof Date) {
        if (isNaN(dateInput.getTime())) return "";
        // Adjust for timezone offset before converting to ISO string to avoid off-by-one-day errors.
        const tzoffset = dateInput.getTimezoneOffset() * 60000; //offset in milliseconds
        const localISOTime = (new Date(dateInput.getTime() - tzoffset)).toISOString().split('T')[0];
        return localISOTime;
    }

    // Case 2: Input is an Excel serial date number
    if (typeof dateInput === 'number' && dateInput > 1) {
        // Excel's epoch is 1899-12-30. JS's is 1970-01-01. 25569 is the day difference.
        const date = new Date(Math.round((dateInput - 25569) * 86400 * 1000));
        if (isNaN(date.getTime())) return "";
        const tzoffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - tzoffset).toISOString().split('T')[0];
    }

    // Case 3: Input is a string
    if (typeof dateInput === "string") {
        const dateString = dateInput.trim();

        // 3a. Try YYYY-MM-DD first (standard ISO)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        // 3b. Try slash-separated formats like M/D/YY, DD/MM/YYYY, etc.
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const [p1, p2, p3] = parts.map(p => parseInt(p, 10));
            let year = p3;

            // Handle 2-digit year (e.g., 24 becomes 2024)
            if (year < 100) {
                year += 2000;
            }

            const isValidDate = (y: number, m: number, d: number) => {
                const date = new Date(y, m - 1, d);
                // Check if the date object is valid and hasn't rolled over due to invalid day/month
                return date && date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
            };

            // Try MM/DD/YYYY first, as it matches unambiguous examples from import (e.g., 8/26/24)
            if (isValidDate(year, p1, p2)) {
                return `${year}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
            }

            // Fallback to DD/MM/YYYY as the desired Brazilian format
            if (isValidDate(year, p2, p1)) {
                return `${year}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
            }
        }
    }

    // If no case matches or parsing fails, return empty string
    return "";
};


export const getMonthName = (monthIndex: number) => {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months[monthIndex];
};

export const parseDate = (dateString: string): Date => {
    if (!dateString || typeof dateString !== 'string') {
        return new Date(NaN); // Retorna data inválida para nulo, indefinido, etc.
    }
    
    // Lida com timestamps potenciais pegando apenas a parte da data
    const datePart = dateString.split('T')[0];
    
    const parts = datePart.split('-');
    if (parts.length !== 3) {
        return new Date(NaN); // Retorna data inválida para formato incorreto
    }
    
    const [year, month, day] = parts.map(p => parseInt(p, 10));

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
        return new Date(NaN); // Retorna data inválida se o parse falhar
    }

    // Este método cria corretamente um objeto Date no fuso horário local do usuário à meia-noite.
    return new Date(year, month - 1, day);
}

export const filterTransactionsByMonth = (transactions: Lancamento[], month: number, year: number) => {
  return transactions.filter(t => {
    const d = parseDate(t.data_pagamento);
    return d.getMonth() === month && d.getFullYear() === year;
  });
};