import React, { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  LinearProgress, 
  Alert, 
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Description as FileIcon,
  Close as CloseIcon
} from '@mui/icons-material';

// Define interfaces for TypeScript
interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  errorMessage?: string;
  jobId?: string;
}

interface FileUploadProps {
  onUpload: (file: File) => Promise<{ jobId: string; message: string }>;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  maxFiles?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  acceptedFileTypes = ['.csv', '.xlsx', '.xls'],
  maxFileSize = 50 * 1024 * 1024, // 50MB
  maxFiles = 1
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Process and validate files
  const processFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    setError(null);

    // Check if adding more files would exceed maxFiles
    if (files.length + fileList.length > maxFiles) {
      setError(`Cannot upload more than ${maxFiles} file${maxFiles > 1 ? 's' : ''}`);
      return;
    }

    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      
      // Validate file type
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFileTypes.includes(fileExtension)) {
        setError(`File type ${fileExtension} is not supported. Accepted types: ${acceptedFileTypes.join(', ')}`);
        continue;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        setError(`File ${file.name} exceeds the maximum size of ${formatFileSize(maxFileSize)}`);
        continue;
      }

      // Add file to list
      newFiles.push({
        id: `file-${Date.now()}-${i}`,
        file,
        progress: 0,
        status: 'pending'
      });
    }

    setFiles([...files, ...newFiles]);
  };

  // Remove file from list
  const removeFile = (id: string) => {
    setFiles(files.filter(file => file.id !== id));
  };

  // Upload file
  const uploadFile = async (id: string) => {
    const fileToUpload = files.find(file => file.id === id);
    if (!fileToUpload) return;

    // Update file status
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, status: 'uploading', progress: 0 } : file
    ));

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(file => 
          file.id === id && file.status === 'uploading' && file.progress < 90
            ? { ...file, progress: file.progress + 10 }
            : file
        ));
      }, 500);

      // Actual upload
      const result = await onUpload(fileToUpload.file);
      
      clearInterval(progressInterval);

      // Update file status with job ID
      setFiles(prev => prev.map(file => 
        file.id === id ? { 
          ...file, 
          status: 'completed', 
          progress: 100,
          jobId: result.jobId
        } : file
      ));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
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

  // Upload all pending files
  const uploadAllFiles = () => {
    files.forEach(file => {
      if (file.status === 'pending') {
        uploadFile(file.id);
      }
    });
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
        Upload Property Data
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
          backgroundColor: dragActive ? 'action.hover' : 'background.paper',
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
          multiple={maxFiles > 1}
        />
        <CloudUploadIcon color="primary" fontSize="large" />
        <Typography variant="h6" mt={2}>
          Drag and drop files here or click to browse
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
          {files.map((file) => (
            <ListItem
              key={file.id}
              sx={{
                backgroundColor: 'background.paper',
                mb: 1,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <ListItemIcon>
                <FileIcon />
              </ListItemIcon>
              <ListItemText
                primary={file.file.name}
                secondary={`${formatFileSize(file.file.size)} • ${file.status === 'completed' 
                  ? 'Uploaded' 
                  : file.status === 'error' 
                    ? 'Error' 
                    : file.status === 'uploading' 
                      ? 'Uploading...' 
                      : 'Ready to upload'
                }`}
              />
              {file.status === 'uploading' && (
                <Box sx={{ width: '100%', mr: 1 }}>
                  <LinearProgress variant="determinate" value={file.progress} />
                </Box>
              )}
              <ListItemSecondaryAction>
                {file.status === 'pending' && (
                  <IconButton edge="end" onClick={() => removeFile(file.id)}>
                    <CloseIcon />
                  </IconButton>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      {/* Upload button */}
      {files.some(file => file.status === 'pending') && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<CloudUploadIcon />}
          onClick={uploadAllFiles}
        >
          Upload Files
        </Button>
      )}
    </Paper>
  );
};

export default FileUpload;