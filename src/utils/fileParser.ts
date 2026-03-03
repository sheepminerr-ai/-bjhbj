import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';

export interface ParsedFile {
  name: string;
  type: 'text' | 'inlineData';
  content: string;
  mimeType?: string;
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return {
      name: file.name,
      type: 'text',
      content: result.value,
    };
  }

  if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let textContent = '';
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      textContent += `\n--- Sheet: ${sheetName} ---\n${csv}\n`;
    }
    return {
      name: file.name,
      type: 'text',
      content: textContent,
    };
  }

  if (extension === 'txt' || extension === 'md') {
    const text = await file.text();
    return {
      name: file.name,
      type: 'text',
      content: text,
    };
  }

  // For images and PDFs, we send them as inlineData
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve({
        name: file.name,
        type: 'inlineData',
        content: base64Data,
        mimeType: file.type || getMimeTypeFromExtension(extension),
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getMimeTypeFromExtension(ext?: string): string {
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'heic': return 'image/heic';
    case 'heif': return 'image/heif';
    default: return 'application/octet-stream';
  }
}
