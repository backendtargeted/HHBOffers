import * as XLSX from 'xlsx';
import Papa from 'papaparse';

/**
 * Extract headers from CSV or Excel file
 * @param file File to extract headers from
 * @returns Array of header names
 */
export const extractFileHeaders = async (file: File): Promise<string[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') {
    return extractCsvHeaders(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return extractExcelHeaders(file);
  }
  
  throw new Error('Unsupported file type for header extraction.');
};

/**
 * Extract headers from CSV file
 * @param file CSV file
 * @returns Array of header names
 */
const extractCsvHeaders = (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false, // Read the first row as data, not headers object
      preview: 1, // Parse only the first row
      skipEmptyLines: true,
      complete: (results: Papa.ParseResult<any>) => {
        if (results.data && results.data.length > 0 && Array.isArray(results.data[0])) {
          // Filter out any potential null/empty values from the header row
          const headers = (results.data[0] as any[]).map(String).filter(h => h && h.trim() !== '');
          if (headers.length > 0) {
             resolve(headers);
          } else {
             reject(new Error('No valid headers found in the first row of the CSV file.'));
          }
        } else {
          reject(new Error('Could not parse headers from CSV file. Is the file empty or malformed?'));
        }
      },
      error: (error: Error) => {
        console.error("CSV Parsing Error:", error);
        reject(new Error(`Error parsing CSV file: ${error.message}`));
      }
    });
  });
};

/**
 * Extract headers from Excel file
 * @param file Excel file
 * @returns Array of header names
 */
const extractExcelHeaders = async (file: File): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('Failed to read file data.'));
          return;
        }
        
        const workbook = XLSX.read(data, { type: 'array' }); // Use 'array' for ArrayBuffer
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
           reject(new Error('No sheets found in the Excel file.'));
           return;
        }
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON array of arrays to get the first row accurately
        const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        
        // Headers are in the first row
        if (jsonData.length > 0 && Array.isArray(jsonData[0])) {
           // Filter out null/empty values and convert to string
           // Explicitly type 'h' as string in the filter and map
           const headers = jsonData[0].map(String).filter((h: string) => h && h.trim() !== '');
           if (headers.length > 0) {
              resolve(headers);
           } else {
              reject(new Error('No valid headers found in the first row of the Excel sheet.'));
           }
        } else {
          reject(new Error('No header row found in Excel file or the sheet is empty.'));
        }
      } catch (error: unknown) {
         console.error("Excel Parsing Error:", error);
         const message = error instanceof Error ? error.message : 'Unknown error during Excel parsing.';
         reject(new Error(`Error processing Excel file: ${message}`));
      }
    };
    
    reader.onerror = (error) => {
      console.error("FileReader Error:", error);
      reject(new Error(`Failed to read the file: ${error}`));
    };
    
    reader.readAsArrayBuffer(file); // Read as ArrayBuffer for XLSX library
  });
};
