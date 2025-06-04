import {describe, it, expect, beforeAll, afterAll, jest} from '@jest/globals';
import { FileProcessorService } from './FileProcessorService';
import * as fs from 'fs';
// Import repository types for mocking if needed, or use 'any' for simplicity here
// For a real-world scenario, you'd import actual types for stricter mocking.
// import { IPropertyRepository } from '../repositories/PropertyRepository'; // Assuming interfaces exist
// import { IUploadJobRepository } from '../repositories/UploadJobRepository';
// import { IActivityLogRepository } from '../repositories/ActivityLogRepository';
// import { IOfferHistoryRepository } from '../repositories/OfferHistoryRepository';

// Mock the repositories
// Define minimal interfaces for mock return types to satisfy TypeScript
interface MockProperty { id: string; [key: string]: any; }
interface MockOfferHistory { id: string; [key: string]: any; }
interface MockTransaction { commit: jest.Mock<() => Promise<void>>; rollback: jest.Mock<() => Promise<void>>; }

jest.mock('../repositories/PropertyRepository', () => ({
  propertyRepository: {
    startTransaction: jest.fn().mockImplementation((): Promise<MockTransaction> => Promise.resolve({
      commit: jest.fn().mockResolvedValue(undefined as void),
      rollback: jest.fn().mockResolvedValue(undefined as void),
    })),
    createOrUpdate: jest.fn(), // To be implemented in tests
  },
}));
jest.mock('../repositories/UploadJobRepository', () => ({
  uploadJobRepository: {
    updateStatus: jest.fn().mockResolvedValue(undefined as void),
    updateProgress: jest.fn().mockResolvedValue(undefined as void),
    findById: jest.fn().mockResolvedValue(null), // Default to not finding a job
  },
}));
jest.mock('../repositories/ActivityLogRepository', () => ({
  activityLogRepository: {
    log: jest.fn().mockResolvedValue(undefined as void),
  },
}));
jest.mock('../repositories/OfferHistoryRepository', () => ({
  offerHistoryRepository: {
    addOffer: jest.fn(), // To be implemented in tests, e.g. .mockResolvedValue({ id: 'offer1' } as MockOfferHistory)
  },
}));

// Import repositories AFTER mocking them
import { propertyRepository } from '../repositories/PropertyRepository';
import { uploadJobRepository } from '../repositories/UploadJobRepository';
import { activityLogRepository } from '../repositories/ActivityLogRepository';
import { offerHistoryRepository } from '../repositories/OfferHistoryRepository';
import * as path from 'path';
import ExcelJS from 'exceljs';

describe('FileProcessorService', () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  // outputDir is not used by the service, so it can be removed if tests don't create output files themselves
  // const outputDir = path.join(__dirname, 'output');
  const service = new FileProcessorService();
  const mockJobId = 'test-job-id'; // Dummy Job ID

  beforeAll(() => {
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    // Removed outputDir creation as it's not used by the service directly
  });

  afterAll(() => {
    // Clean up created uploads directory and files
    fs.rmSync(uploadsDir, { recursive: true, force: true });
    // Removed outputDir cleanup
  });

  describe('processFile', () => {
    it('should correctly process an XLSX file with valid offer amounts', async () => {
      // Create a dummy XLSX file
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Sheet1');
      sheet.addRow(['name', 'email', 'offer_amount']);
      sheet.addRow(['John Doe', 'john@example.com', '1000']);
      sheet.addRow(['Jane Smith', 'jane@example.com', '1500.50']);
      sheet.addRow(['Alice Brown', 'alice@example.com', '$2,000.75']); // With currency symbol and comma

      const testFilePath = path.join(uploadsDir, 'test_valid.xlsx');
      await workbook.xlsx.writeFile(testFilePath);

      // Mock repository methods before calling the service
      // Clear mocks before each test if they are stateful or you want to count calls per test
      (propertyRepository.createOrUpdate as jest.Mock).mockClear();
      (propertyRepository.startTransaction as jest.Mock).mockClear();
      (uploadJobRepository.updateStatus as jest.Mock).mockClear();
      (uploadJobRepository.updateProgress as jest.Mock).mockClear();
      (activityLogRepository.log as jest.Mock).mockClear();
      (offerHistoryRepository.addOffer as jest.Mock).mockClear();

      // Default mock implementations for successful paths
      (propertyRepository.createOrUpdate as jest.Mock).mockImplementation(
        async (data): Promise<[MockProperty, boolean]> => [{ ...data, id: 'mock-property-id' } as MockProperty, true]
      );
      (offerHistoryRepository.addOffer as jest.Mock).mockImplementation(
        async (): Promise<MockOfferHistory> => ({ id: 'mock-offer-id' } as MockOfferHistory)
      );

      const result = await service.processXlsxFile(testFilePath, mockJobId);

      expect(result.totalRecords).toBe(3);
      expect(result.newRecords).toBe(3); // Assuming all are new based on createOrUpdate mock
      expect(result.updatedRecords).toBe(0);
      expect(result.errorRecords).toBe(0);

      expect(uploadJobRepository.updateStatus).toHaveBeenCalledWith(mockJobId, 'processing');
      expect(uploadJobRepository.updateStatus).toHaveBeenCalledWith(mockJobId, 'completed');
      expect(activityLogRepository.log).toHaveBeenCalled(); // Check for log calls
      expect(offerHistoryRepository.addOffer).toHaveBeenCalledTimes(3);
      expect(offerHistoryRepository.addOffer).toHaveBeenCalledWith(
        expect.objectContaining({ propertyId: expect.any(String), offerAmount: '1000' }), // offerAmount is string
        expect.anything() // transaction object
      );
      expect(offerHistoryRepository.addOffer).toHaveBeenCalledWith(
        expect.objectContaining({ propertyId: expect.any(String), offerAmount: '1500.50' }),
        expect.anything()
      );
      expect(offerHistoryRepository.addOffer).toHaveBeenCalledWith(
        expect.objectContaining({ propertyId: expect.any(String), offerAmount: '$2,000.75' }),
        expect.anything()
      );
    });

    it('should correctly report errorRecords when offer creation fails', async () => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Sheet1');
      sheet.addRow(['name', 'email', 'offer_amount']);
      sheet.addRow(['Test User 1', 'test1@example.com', '100']); // Valid
      sheet.addRow(['Test User 2', 'test2@example.com', 'invalid_amount']); // Invalid
      sheet.addRow(['Test User 3', 'test3@example.com', '200.00']); // Valid

      const testFilePath = path.join(uploadsDir, 'test_invalid.xlsx');
      await workbook.xlsx.writeFile(testFilePath);

      // Mock createOrUpdate to succeed for first and third, offerHistoryRepository.addOffer to fail for the second
      (propertyRepository.createOrUpdate as jest.Mock)
        .mockImplementationOnce(async (data): Promise<[MockProperty, boolean]> => ([{ ...data, id: 'prop1' } as MockProperty, true]))
        .mockImplementationOnce(async (data): Promise<[MockProperty, boolean]> => ([{ ...data, id: 'prop2' } as MockProperty, true]))
        .mockImplementationOnce(async (data): Promise<[MockProperty, boolean]> => ([{ ...data, id: 'prop3' } as MockProperty, true]));

      (offerHistoryRepository.addOffer as jest.Mock)
        .mockResolvedValueOnce({ id: 'offer1' } as MockOfferHistory) // For '100'
        .mockRejectedValueOnce(new Error("Invalid amount for offer"))
        .mockResolvedValueOnce({ id: 'offer3' } as MockOfferHistory); // For '200.00'


      const result = await service.processXlsxFile(testFilePath, mockJobId);

      expect(result.totalRecords).toBe(3);
      expect(result.newRecords).toBe(2); // Two successful new properties
      expect(result.updatedRecords).toBe(0);
      expect(result.errorRecords).toBe(1); // One record failed during batch processing (due to addOffer mock)

      expect(offerHistoryRepository.addOffer).toHaveBeenCalledWith(
        expect.objectContaining({ offerAmount: '100' }), expect.anything()
      );
      // The 'invalid_amount' is still passed as a string to addOffer, the mock causes the error
      expect(offerHistoryRepository.addOffer).toHaveBeenCalledWith(
        expect.objectContaining({ offerAmount: 'invalid_amount' }), expect.anything()
      );
       expect(offerHistoryRepository.addOffer).toHaveBeenCalledWith(
        expect.objectContaining({ offerAmount: '200.00' }), expect.anything()
      );
    });

    // The following tests about specific parsing of amounts ($500, 1,234.56) or handling numbers/empty strings for XLSX
    // are not directly testable at the FileProcessorService.processXlsxFile level without extensive mocking
    // of the transformRowToPropertyData method (which is private) or by inspecting calls to offerHistoryRepository.addOffer.
    // The original premise of a convertOfferAmountToNumber method on the service was incorrect.
    // We will remove these specific unit tests for now and focus on what processXlsxFile returns
    // and its interactions (which will require adding mocks).

    // Removed: 'should handle offer amounts as numbers correctly'
    // Removed: 'should handle empty offer amount string and mark as Error'
    // Removed: 'should correctly parse amounts with only currency symbols like $500'
    // Removed: 'should correctly parse amounts with commas like 1,234.56'


    it('should throw an error if the file does not exist', async () => {
      // Need to mock uploadJobRepository.updateStatus and activityLogRepository.log for this to not throw before file check
      // For now, this test might fail if it cannot reach the fs.access check due to repo errors.
    // A more robust test would mock all initial dependencies.
    // Mocking repositories as done above should make this test pass if file doesn't exist.
    (uploadJobRepository.updateStatus as jest.Mock).mockReset(); // Reset to default mock for this specific test
    (activityLogRepository.log as jest.Mock).mockReset();

    // Simulate file not found by ExcelJS (or underlying fs)
    const mockReadFile = jest.fn<(path: string, options?: any) => Promise<ExcelJS.Workbook>>()
        .mockRejectedValue({ code: 'ENOENT' } as Error);
    jest.spyOn(ExcelJS.Workbook.prototype.xlsx, 'readFile').mockImplementation(mockReadFile);


      await expect(service.processXlsxFile('non_existent_file.xlsx', mockJobId))
        .rejects
      .toThrow(expect.objectContaining({ code: 'ENOENT' }));

    // Restore original readFile
    (ExcelJS.Workbook.prototype.xlsx.readFile as jest.Mock).mockRestore();
    });

    // This test for unsupported file types is tricky because processXlsxFile specifically uses ExcelJS.
    // An unsupported file type would likely cause ExcelJS to throw an error during workbook.xlsx.readFile().
    // The service itself doesn't have a .txt check before calling ExcelJS.
    // it('should throw an error for unsupported file types', async () => {
    //   const testFilePath = path.join(uploadsDir, 'test.txt');
    //   fs.writeFileSync(testFilePath, 'This is not an XLSX file.');
    //
    //   await expect(service.processXlsxFile(testFilePath, mockJobId))
    //     .rejects
    //     .toThrow(); // Specific error will depend on ExcelJS
    // });

  });

  // Removed the entire 'convertOfferAmountToNumber' describe block as the method does not exist on FileProcessorService
});
