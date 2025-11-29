'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/api';
import { FileInfo } from '@/types/file';
import FileGridItem from './FileGridItem';
import BreadcrumbsNav from './BreadcrumbsNav';
import CreateFolderDialog from './CreateFolderDialog';
import ConfirmDialog from './ConfirmDialog';

export default function FileExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPath = searchParams.get('path') || '/';
  const queryClient = useQueryClient();
  
  const [errorOpen, setErrorOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<FileInfo | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [fileToRename, setFileToRename] = React.useState<FileInfo | null>(null);

  const { data: files, isLoading, error } = useQuery<FileInfo[]>({
    queryKey: ['files', currentPath],
    queryFn: async () => {
      const res = await api.get('/files', { params: { path: currentPath } });
      return res.data;
    },
    retry: false,
  });

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      await api.post('/files/mkdir', { path: currentPath, name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', currentPath] });
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Failed to create folder');
      setErrorOpen(true);
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (file: FileInfo) => {
      const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      await api.delete('/files', { params: { path: filePath } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', currentPath] });
      setDeleteConfirmOpen(false);
      setFileToDelete(null);
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Failed to delete file');
      setErrorOpen(true);
    },
  });

  const renameFileMutation = useMutation({
    mutationFn: async ({ file, newName }: { file: FileInfo; newName: string }) => {
      const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      await api.patch('/files/rename', { path: filePath, newName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', currentPath] });
      setRenameDialogOpen(false);
      setFileToRename(null);
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Failed to rename file');
      setErrorOpen(true);
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', currentPath);
      
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', currentPath] });
      setUploadProgress(null);
    },
    onError: (error: any) => {
      setUploadProgress(null);
      setErrorMessage(error.response?.data?.message || 'Failed to upload file');
      setErrorOpen(true);
    },
  });

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      uploadFileMutation.mutate(file);
    });
  }, [uploadFileMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    noClick: true,
    noKeyboard: true
  });

  React.useEffect(() => {
    if (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setErrorOpen(true);
    }
  }, [error]);

  const handleNavigate = (path: string) => {
    router.push(`/?path=${encodeURIComponent(path)}`);
  };

  const handleFileClick = async (file: FileInfo) => {
    if (file.type === 'directory') {
      const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      handleNavigate(newPath);
    } else {
      const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      window.open(`http://localhost:4000/api/files/download?path=${encodeURIComponent(filePath)}`, '_blank');
    }
  };

  const handleDeleteClick = (file: FileInfo) => {
    setFileToDelete(file);
    setDeleteConfirmOpen(true);
  };

  const handleRenameClick = (file: FileInfo) => {
    setFileToRename(file);
    setRenameDialogOpen(true);
  };

  const handleCloseError = () => {
    setErrorOpen(false);
  };

  return (
    <Box {...getRootProps()} sx={{ minHeight: 'calc(100vh - 100px)', position: 'relative' }}>
      <input {...getInputProps()} />
      
      {isDragActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(25, 118, 210, 0.1)',
            zIndex: 10,
            border: '2px dashed #1976d2',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ textAlign: 'center', color: 'primary.main' }}>
            <CloudUploadIcon sx={{ fontSize: 60, mb: 1 }} />
            <Box sx={{ typography: 'h5' }}>Drop files here to upload</Box>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <BreadcrumbsNav currentPath={currentPath} onNavigate={handleNavigate} />
        <Button 
          variant="contained" 
          startIcon={<CreateNewFolderIcon />}
          onClick={() => setCreateFolderOpen(true)}
        >
          New Folder
        </Button>
      </Box>

      {uploadProgress !== null && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {isLoading ? (
        <Grid container spacing={2}>
          {[...Array(8)].map((_, i) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
              <Skeleton width="60%" sx={{ mt: 1 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          {files?.map((file) => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={file.name}>
              <FileGridItem 
                file={file} 
                onClick={handleFileClick} 
                onDelete={handleDeleteClick}
                onRename={handleRenameClick}
              />
            </Grid>
          ))}
          {files?.length === 0 && (
            <Box sx={{ p: 4, width: '100%', textAlign: 'center', color: 'text.secondary' }}>
              Folder is empty. Drag and drop files to upload.
            </Box>
          )}
        </Grid>
      )}

      <CreateFolderDialog 
        open={createFolderOpen} 
        onClose={() => setCreateFolderOpen(false)} 
        onCreate={(name) => createFolderMutation.mutate(name)} 
      />

      <CreateFolderDialog 
        open={renameDialogOpen} 
        onClose={() => setRenameDialogOpen(false)} 
        onCreate={(newName) => {
          if (fileToRename) {
            renameFileMutation.mutate({ file: fileToRename, newName });
          }
        }} 
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Item"
        content={`Are you sure you want to delete "${fileToDelete?.name}"? This action cannot be undone.`}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => fileToDelete && deleteFileMutation.mutate(fileToDelete)}
      />

      <Snackbar open={errorOpen} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}