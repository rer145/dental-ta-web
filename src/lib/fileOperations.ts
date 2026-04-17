import type { CaseData } from './storage';

export async function saveCase(caseData: CaseData): Promise<void> {
  const json = JSON.stringify(caseData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `case_${caseData.properties.case_number || 'unnamed'}_${Date.now()}.dta`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function loadCase(file: File): Promise<CaseData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as CaseData;
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid file format'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

export function exportToPDF() {
  // Trigger browser print dialog
  window.print();
}