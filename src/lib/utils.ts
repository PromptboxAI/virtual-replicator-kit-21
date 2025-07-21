import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDecimalPlaces(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  
  // If the integer part is 0, show 6 decimal places
  if (Math.floor(Math.abs(num)) === 0) {
    return num.toFixed(6);
  }
  
  // If there's a non-zero integer part, show 2 decimal places
  return num.toFixed(2);
}
