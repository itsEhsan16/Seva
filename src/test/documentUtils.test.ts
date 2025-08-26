import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  validateDocument, 
  uploadDocument, 
  uploadMultipleDocuments,
  formatFileSize,
  getFileExtension,
  isImageFile,
  isPdfFile
} from '@/lib/documentUtils';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client');
const mockSupabase = vi.mocked(supabase);

describe('documentUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateDocument', () => {
    it('validates file size correctly', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf'
      });

      const result = validateDocument(largeFile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('large.pdf: File size must be less than 5MB');
    });

    it('validates file type correctly', () => {
      const invalidFile = new File(['content'], 'test.txt', {
        type: 'text/plain'
      });

      const result = validateDocument(invalidFile);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('test.txt: Only PDF, JPG, and PNG files are allowed');
    });

    it('validates file name length', () => {
      const longNameFile = new File(['content'], 'a'.repeat(101) + '.pdf', {
        type: 'application/pdf'
      });

      const result = validateDocument(longNameFile);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('File name is too long');
    });

    it('passes validation for valid files', () => {
      const validFile = new File(['content'], 'test.pdf', {
        type: 'application/pdf'
      });

      const result = validateDocument(validFile);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates multiple file types', () => {
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const jpgFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File(['content'], 'test.png', { type: 'image/png' });

      expect(validateDocument(pdfFile).isValid).toBe(true);
      expect(validateDocument(jpgFile).isValid).toBe(true);
      expect(validateDocument(pngFile).isValid).toBe(true);
    });
  });

  describe('uploadDocument', () => {
    beforeEach(() => {
      mockSupabase.storage = {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({
            data: { path: 'test-path' },
            error: null
          })
        })
      } as any;
    });

    it('uploads document successfully', async () => {
      const file = new File(['content'], 'test.pdf', {
        type: 'application/pdf'
      });

      const result = await uploadDocument(file, 'user-id', 'license');

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('test-path');
      expect(mockSupabase.storage.from).toHaveBeenCalledWith('provider-documents');
    });

    it('handles upload errors', async () => {
      mockSupabase.storage = {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Upload failed')
          })
        })
      } as any;

      const file = new File(['content'], 'test.pdf', {
        type: 'application/pdf'
      });

      const result = await uploadDocument(file, 'user-id', 'license');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Upload failed');
    });

    it('validates file before upload', async () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf'
      });

      const result = await uploadDocument(largeFile, 'user-id', 'license');

      expect(result.success).toBe(false);
      expect(result.error).toContain('File size must be less than 5MB');
    });
  });

  describe('uploadMultipleDocuments', () => {
    beforeEach(() => {
      mockSupabase.storage = {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({
            data: { path: 'test-path' },
            error: null
          })
        })
      } as any;
    });

    it('uploads multiple documents successfully', async () => {
      const files = [
        new File(['content1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })
      ];

      const result = await uploadMultipleDocuments(files, 'user-id');

      expect(result.success).toBe(true);
      expect(result.filePaths).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('handles partial failures', async () => {
      let callCount = 0;
      mockSupabase.storage = {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve({ data: { path: 'test-path-1' }, error: null });
            } else {
              return Promise.resolve({ data: null, error: new Error('Upload failed') });
            }
          })
        })
      } as any;

      const files = [
        new File(['content1'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['content2'], 'test2.jpg', { type: 'image/jpeg' })
      ];

      const result = await uploadMultipleDocuments(files, 'user-id');

      expect(result.success).toBe(false);
      expect(result.filePaths).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('utility functions', () => {
    it('formats file size correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('extracts file extension correctly', () => {
      expect(getFileExtension('test.pdf')).toBe('pdf');
      expect(getFileExtension('image.jpg')).toBe('jpg');
      expect(getFileExtension('document.docx')).toBe('docx');
      expect(getFileExtension('noextension')).toBe('');
    });

    it('identifies image files correctly', () => {
      const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      expect(isImageFile(imageFile)).toBe(true);
      expect(isImageFile(pdfFile)).toBe(false);
    });

    it('identifies PDF files correctly', () => {
      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

      expect(isPdfFile(pdfFile)).toBe(true);
      expect(isPdfFile(imageFile)).toBe(false);
    });
  });
});