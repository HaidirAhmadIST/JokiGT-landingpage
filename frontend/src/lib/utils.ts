import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHealthStatus(status: string | null | undefined): string {
  if (!status) return 'Sehat';
  
  const map: Record<string, string> = {
    'sehat': 'Sehat',
    'sehat_dengan_catatan': 'Sehat dengan Catatan',
    'tidak_sehat': 'Tidak Sehat',
    'fit': 'Sehat',
    'fit_with_note': 'Sehat dengan Catatan',
    'unfit': 'Tidak Sehat',
    'sakit_ringan': 'Sehat dengan Catatan',
    'sakit_berat': 'Tidak Sehat',
  };

  if (map[status.toLowerCase()]) {
    return map[status.toLowerCase()];
  }

  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}
