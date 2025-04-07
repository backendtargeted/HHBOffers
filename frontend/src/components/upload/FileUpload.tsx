import React, { useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  LinearProgress, 
  Alert, 
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
  // Tooltip - Removed Tooltip import and usage
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Description as FileIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon, // Added for completed status
  Error as ErrorIcon, // Added for error status
  HelpOutline as HelpIcon // Added for mapping pending status
} from '@mui/icons-material';

// Add imports for the new components and services
import HeaderMappingDialog from './HeaderMappingDialog';
// Assuming fileService is in ../../services/fileService
import { extractFileHeaders } from '../../services/fileService'; 

// Define interfaces for TypeScript
interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  // Added 'mapping' status
  status: 'pending' | 'mapping' | 'uploading' | 'completed' | 'error'; 
  errorMessage?: string;
  jobId?: string;
}

interface FileUploadProps {
  // Update onUpload signature to accept headerMapping
  onUpload: (file: File, headerMapping?: Record<string, string>) => Promise<{ jobId: string; message: string }>; 
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  acceptedFileTypes = ['.csv', '.xlsx', '.xls'],
  maxFileSize = 5000 * 1024 * 1024, // 5000MB
  maxFiles = 1 // Defaulting to 1 as per original logic, header mapping works best one file at a time
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Add state for headers and mapping dialog
  const [headers, setHeaders] = useState<string[]>([]);
  const [showMappingDialog, setShowMappingDialog] = useState<boolean>(false);
  // Store the file object that needs mapping, not just the ID
  const [fileToMap, setFileToMap] = useState<UploadedFile | null>(null); 
  const [headerMapping, setHeaderMapping] = useState<Record<string, string>>({});

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    processFiles(selectedFiles);
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = e.dataTransfer.files;
    processFiles(droppedFiles);
  };

  // Add a function to extract headers from a file
  const extractHeaders = async (file: File): Promise<string[]> => {
    try {
      // Ensure fileService exists before calling
      if (typeof extractFileHeaders !== 'function') {
         throw new Error("fileService not available");
      }
      const fileHeaders = await extractFileHeaders(file);
      setHeaders(fileHeaders);
      return fileHeaders;
    } catch (error) {
      console.error('Error extracting headers:', error);
      setError(`Failed to read headers from ${file.name}. Please check the file format or ensure fileService is loaded.`);
      return [];
    }
  };

  // Modify the processFiles function to extract headers
  const processFiles = async (fileList: FileList | null) => {
    if (!fileList) return;

    setError(null);

    // Since mapping is per file, enforce maxFiles = 1 for simplicity now
    if (maxFiles > 1) {
       console.warn("Header mapping currently works best with maxFiles=1. Processing only the first file.");
    }
    if (files.length >= maxFiles) {
       setError(`Cannot upload more than ${maxFiles} file${maxFiles > 1 ? 's' : ''}. Please remove existing files first.`);
       return;
    }


    const file = fileList[0]; // Process only the first file if multiple selected/dropped
    if (!file) return;
    
    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedFileTypes.includes(fileExtension)) {
      setError(`File type ${fileExtension} is not supported. Accepted types: ${acceptedFileTypes.join(', ')}`);
      return; // Stop processing if invalid type
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setError(`File ${file.name} exceeds the maximum size of ${formatFileSize(maxFileSize)}`);
      return; // Stop processing if too large
    }

    // Extract headers
    const fileId = `file-${Date.now()}-0`; // Use index 0
    const newFile: UploadedFile = {
      id: fileId,
      file,
      progress: 0,
      status: 'pending' // Start as pending
    };

    // Add the file first
    setFiles([newFile]); // Replace existing files if maxFiles is 1

    // Extract headers and trigger mapping dialog
    const extractedHeaders = await extractHeaders(file);
    if (extractedHeaders.length > 0) {
      setFileToMap(newFile); // Set the file that needs mapping
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'mapping' } : f)); // Update status
      setShowMappingDialog(true);
    } else {
      // If headers couldn't be extracted, mark as error
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'error', errorMessage: 'Could not extract headers.' } : f));
      if (!error) { // Avoid overwriting specific extraction error
         setError(`Could not extract headers from ${file.name}.`);
      }
    }
  };


  // Remove file from list
  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
    // If removing the file being mapped, close dialog
    if (fileToMap?.id === id) {
        setShowMappingDialog(false);
        setFileToMap(null);
        setHeaders([]);
    }
  };

  // Modify uploadFile to include header mapping
  const uploadFile = async (id: string, currentMapping: Record<string, string>) => {
    const fileToUpload = files.find(file => file.id === id);
    if (!fileToUpload || fileToUpload.status === 'uploading' || fileToUpload.status === 'completed') return;

    // Update file status
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, status: 'uploading', progress: 0 } : file
    ));

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      // Simulate upload progress more realistically
      let currentProgress = 0;
      progressInterval = setInterval(() => {
        currentProgress += Math.random() * 10 + 5; // Simulate variable progress
        if (currentProgress >= 95) { // Stop simulation near the end
           if (progressInterval) clearInterval(progressInterval);
           currentProgress = 95;
        }
        setFiles(prev => prev.map(file => 
          file.id === id && file.status === 'uploading'
            ? { ...file, progress: Math.min(currentProgress, 95) } // Cap at 95 until confirmed
            : file
        ));
      }, 300);

      // Actual upload with header mapping
      const result = await onUpload(fileToUpload.file, headerMapping); // Pass headerMapping
      
      if (progressInterval) clearInterval(progressInterval);

      // Update file status with job ID upon success
      setFiles(prev => prev.map(file => 
        file.id === id ? { 
          ...file, 
          status: 'completed', 
          progress: 100,
          jobId: result.jobId 
        } : file
      ));

    } catch (uploadError) {
      if (progressInterval) clearInterval(progressInterval);
      const errorMessage = uploadError instanceof Error ? uploadError.message : 'Unknown error occurred during upload';
      
      // Update file status with error
      setFiles(prev => prev.map(file => 
        file.id === id ? { 
          ...file, 
          status: 'error', 
          progress: 0,
          errorMessage 
        } : file
      ));

      setError(`Failed to upload ${fileToUpload.file.name}: ${errorMessage}`);
    }
  };

  // Add a handler for header mapping confirmation
  const handleMappingConfirm = (mapping: Record<string, string>) => {
    setHeaderMapping(mapping); // Store the confirmed mapping
    setShowMappingDialog(false);
    
    // Upload the file that was waiting for mapping
    if (fileToMap) {
      uploadFile(fileToMap.id, mapping); // Pass the confirmed mapping directly
      setFileToMap(null); // Clear the file waiting for mapping
    }
  };
  
  // Handle closing the mapping dialog without confirming
  const handleMappingCancel = () => {
      setShowMappingDialog(false);
      // If user cancels mapping, remove the file or mark as error?
      // For now, let's remove it to avoid confusion
      if (fileToMap) {
          removeFile(fileToMap.id);
      }
      setFileToMap(null);
      setHeaders([]);
  };

  // No longer need uploadAllFiles as we process one at a time with mapping
  // const uploadAllFiles = () => { ... };

  // Helper to get status icon and text
  const getStatusInfo = (file: UploadedFile): { icon: React.ReactNode; text: string; color: string } => {
    switch (file.status) {
      case 'pending':
        return { icon: <FileIcon />, text: 'Ready to upload', color: 'text.secondary' };
      case 'mapping':
        return { icon: <HelpIcon color="warning" />, text: 'Waiting for header mapping', color: 'warning.main' };
      case 'uploading':
        return { icon: <CloudUploadIcon color="primary" />, text: 'Uploading...', color: 'primary.main' };
      case 'completed':
        return { icon: <CheckCircleIcon color="success" />, text: `Uploaded (Job ID: ${file.jobId || 'N/A'})`, color: 'success.main' };
      case 'error':
        return { icon: <ErrorIcon color="error" />, text: `Error: ${file.errorMessage || 'Unknown error'}`, color: 'error.main' };
      default:
        return { icon: null, text: 'Unknown status', color: 'text.secondary' }; // Return null for unknown status
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        padding: 3,
        width: '100%'
      }}
    >
      <Typography variant="h6" gutterBottom>
        Upload Property Data (Single File)
      </Typography>

      {/* Drop zone */}
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.400',
          borderRadius: 2,
          padding: 4,
          textAlign: 'center',
          backgroundColor: dragActive ? 'action.hover' : 'background.default', // Adjusted background
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          mb: 3
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept={acceptedFileTypes.join(',')}
          multiple={false} // Enforce single file selection
        />
        <CloudUploadIcon color="primary" sx={{ fontSize: 48 }} /> 
        <Typography variant="h6" mt={2}>
          Drag and drop file here or click to browse
        </Typography>
        <Typography variant="body2" color="textSecondary" mt={1}>
          Accepted file types: {acceptedFileTypes.join(', ')}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Maximum file size: {formatFileSize(maxFileSize)}
        </Typography>
      </Box>

      {/* Error message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* File list */}
      {files.length > 0 && (
        <List sx={{ width: '100%', mb: 2 }}>
          {files.map((file) => {
            const { icon, text, color } = getStatusInfo(file);
            return (
              <ListItem
                key={file.id}
                sx={{
                  backgroundColor: 'background.paper',
                  mb: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 1 // Add subtle shadow
                }}
              >
                <ListItemIcon>
                  {/* Tooltip removed */}
                  {icon}
                </ListItemIcon>
                <ListItemText
                  primary={file.file.name}
                  secondary={
                    <Typography variant="body2" color={color} noWrap>
                      {formatFileSize(file.file.size)} • {text}
                    </Typography>
                  }
                  primaryTypographyProps={{ noWrap: true }} // Prevent long filenames from wrapping awkwardly
                />
                {file.status === 'uploading' && (
                  <Box sx={{ width: '30%', mr: 2, ml: 1 }}> {/* Adjusted width and margin */}
                    <LinearProgress variant="determinate" value={file.progress} />
                  </Box>
                )}
                <ListItemSecondaryAction>
                  {/* Allow removal unless completed or actively uploading */}
                  {(file.status === 'pending' || file.status === 'mapping' || file.status === 'error') && (
                    <IconButton edge="end" onClick={() => removeFile(file.id)}>
                      <CloseIcon />
                    </IconButton>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
            );
          })}
        </List>
      )}

      {/* Upload button removed - upload happens automatically after mapping */}
      
      {/* Header Mapping Dialog */}
      {fileToMap && ( // Ensure fileToMap is not null before rendering
        <HeaderMappingDialog
          open={showMappingDialog}
          onClose={handleMappingCancel} // Use cancel handler
          headers={headers}
          onConfirm={handleMappingConfirm}
        />
      )}
    </Paper>
  );
};

export default FileUpload;
