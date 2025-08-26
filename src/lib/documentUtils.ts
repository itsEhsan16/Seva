import { supabase } from "@/integrations/supabase/client";

export interface DocumentUploadResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface DocumentValidationResult {
  isValid: boolean;
  errors: string[];
}

// Validate document file before upload
export const validateDocument = (file: File): DocumentValidationResult => {
  const errors: string[] = [];
  
  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    errors.push(`${file.name}: File size must be less than 5MB`);
  }
  
  // Check file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    errors.push(`${file.name}: Only PDF, JPG, and PNG files are allowed`);
  }
  
  // Check file name length
  if (file.name.length > 100) {
    errors.push(`${file.name}: File name is too long`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Upload document to Supabase Storage
export const uploadDocument = async (
  file: File, 
  userId: string, 
  documentType: string
): Promise<DocumentUploadResult> => {
  try {
    // Validate file first
    const validation = validateDocument(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.join(', ')
      };
    }
    
    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${userId}/${documentType}_${timestamp}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('provider-documents')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      throw error;
    }
    
    return {
      success: true,
      filePath: data.path
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to upload document'
    };
  }
};

// Upload multiple documents
export const uploadMultipleDocuments = async (
  files: File[],
  userId: string
): Promise<{ success: boolean; filePaths: string[]; errors: string[] }> => {
  const filePaths: string[] = [];
  const errors: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const documentType = `document_${i + 1}`;
    
    const result = await uploadDocument(file, userId, documentType);
    
    if (result.success && result.filePath) {
      filePaths.push(result.filePath);
    } else {
      errors.push(result.error || `Failed to upload ${file.name}`);
    }
  }
  
  return {
    success: errors.length === 0,
    filePaths,
    errors
  };
};

// Get document URL from Supabase Storage
export const getDocumentUrl = async (filePath: string): Promise<string | null> => {
  try {
    const { data } = await supabase.storage
      .from('provider-documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error getting document URL:', error);
    return null;
  }
};

// Delete document from Supabase Storage
export const deleteDocument = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('provider-documents')
      .remove([filePath]);
    
    return !error;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};

// Get file size in human readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Extract file extension
export const getFileExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
};

// Check if file is an image
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

// Check if file is a PDF
export const isPdfFile = (file: File): boolean => {
  return file.type === 'application/pdf';
};