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
import ButtonGroup from '@mui/material/ButtonGroup';
import LinearProgress from '@mui/material/LinearProgress';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Paper from '@mui/material/Paper';
import { useDropzone } from 'react-dropzone';
import api from '@/lib/api';
import { FileInfo } from '@/types/file';
import FileGridItem from './FileGridItem';
import FileListItem from './FileListItem';
import BreadcrumbsNav from './BreadcrumbsNav';
import CreateFolderDialog from './CreateFolderDialog';
import ConfirmDialog from './ConfirmDialog';
import { useDragSelect } from '@/hooks/useDragSelect';

interface FileExplorerProps {
  mode?: 'files' | 'recent' | 'trash';
}

export default function FileExplorer({ mode = 'files' }: FileExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPath = searchParams.get('path') || '/';
  const queryClient = useQueryClient();
  
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = React.useState<Set<string>>(new Set());
  const [errorOpen, setErrorOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [fileToDelete, setFileToDelete] = React.useState<FileInfo | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [fileToRename, setFileToRename] = React.useState<FileInfo | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dragStartSelection, setDragStartSelection] = React.useState<Set<string>>(new Set());
  const [isDragAdding, setIsDragAdding] = React.useState(false);

  const { isSelecting, selectionBox, handleMouseDown: handleDragMouseDown } = useDragSelect(containerRef, {
    onSelectionChange: (dragSelection) => {
      if (isDragAdding) {
        setSelectedFiles(new Set([...dragStartSelection, ...dragSelection]));
      } else {
        setSelectedFiles(dragSelection);
      }
    },
    onDragStart: (e) => {
      if (e.ctrlKey || e.metaKey) {
        setIsDragAdding(true);
        setDragStartSelection(selectedFiles);
      } else {
        setIsDragAdding(false);
        setDragStartSelection(new Set());
        setSelectedFiles(new Set());
      }
    },
    itemSelector: '.selectable-item'
  });

  const { data: files, isLoading, error } = useQuery<FileInfo[]>({
    queryKey: ['files', mode, currentPath],
    queryFn: async () => {
      if (mode === 'recent') {
        const res = await api.get('/files/recent');
        return res.data;
      } else if (mode === 'trash') {
        const res = await api.get('/files/trash');
        return res.data;
      } else {
        const res = await api.get('/files', { params: { path: currentPath } });
        return res.data;
      }
    },
    retry: false,
  });

  // Clear selection when path changes
  React.useEffect(() => {
    setSelectedFiles(new Set());
  }, [currentPath, mode]);

  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      await api.post('/files/mkdir', { path: currentPath, name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', mode, currentPath] });
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Failed to create folder');
      setErrorOpen(true);
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: async (file: FileInfo) => {
      let filePath;
      if (mode === 'trash') {
        filePath = `/.trash/${file.name}`;
      } else if (mode === 'recent') {
         throw new Error("Cannot delete from Recent view yet");
      } else {
        filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      }
      await api.delete('/files', { params: { path: filePath } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', mode, currentPath] });
      setDeleteConfirmOpen(false);
      setFileToDelete(null);
      // Remove from selection if it was selected
      setSelectedFiles(prev => {
        const next = new Set(prev);
        // We don't know the name here easily if we just passed file object to mutation
        // But we can invalidate queries which refreshes the list.
        // Ideally we should remove deleted files from selection.
        return next;
      });
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Failed to delete file');
      setErrorOpen(true);
    },
  });

  const deleteMultipleFilesMutation = useMutation({
    mutationFn: async (filesToDelete: FileInfo[]) => {
      // Execute sequentially or parallel
      for (const file of filesToDelete) {
        let filePath;
        if (mode === 'trash') {
          filePath = `/.trash/${file.name}`;
        } else {
          filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
        }
        await api.delete('/files', { params: { path: filePath } });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', mode, currentPath] });
      setSelectedFiles(new Set());
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Failed to delete some files');
      setErrorOpen(true);
    }
  });

  const renameFileMutation = useMutation({
    mutationFn: async ({ file, newName }: { file: FileInfo; newName: string }) => {
      const filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      await api.patch('/files/rename', { path: filePath, newName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', mode, currentPath] });
      setRenameDialogOpen(false);
      setFileToRename(null);
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Failed to rename file');
      setErrorOpen(true);
    },
  });

  const restoreFileMutation = useMutation({
    mutationFn: async (file: FileInfo) => {
      await api.post('/files/restore', { fileName: file.name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', mode, currentPath] });
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Failed to restore file');
      setErrorOpen(true);
    },
  });

  const restoreMultipleFilesMutation = useMutation({
    mutationFn: async (filesToRestore: FileInfo[]) => {
      const fileNames = filesToRestore.map(f => f.name);
      await api.post('/files/restore-multiple', { fileNames });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', mode, currentPath] });
      setSelectedFiles(new Set());
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Failed to restore some files');
      setErrorOpen(true);
    }
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
      queryClient.invalidateQueries({ queryKey: ['files', mode, currentPath] });
      setUploadProgress(null);
    },
    onError: (error: any) => {
      setUploadProgress(null);
      setErrorMessage(error.response?.data?.message || 'Failed to upload file');
      setErrorOpen(true);
    },
  });

  const onDrop = React.useCallback((acceptedFiles: File[]) => {
    if (mode !== 'files') return;
    acceptedFiles.forEach((file) => {
      uploadFileMutation.mutate(file);
    });
  }, [uploadFileMutation, mode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    noClick: true,
    noKeyboard: true,
    disabled: mode !== 'files'
  });

  React.useEffect(() => {
    if (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setErrorOpen(true);
    }
  }, [error]);

  const handleNavigate = (path: string) => {
    if (mode !== 'files') return; // Disable navigation in Recent/Trash for now
    router.push(`/?path=${encodeURIComponent(path)}`);
  };

  const handleFileSelect = (file: FileInfo, multi: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(multi ? prev : []);
      if (newSet.has(file.name)) {
        newSet.delete(file.name);
      } else {
        newSet.add(file.name);
      }
      return newSet;
    });
  };

  const handleFileOpen = async (file: FileInfo) => {
    if (file.type === 'directory') {
      if (mode === 'files') {
        const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
        handleNavigate(newPath);
      }
    } else {
      let filePath = '';
      if (mode === 'files') {
        filePath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      } else if (mode === 'trash') {
        filePath = `/.trash/${file.name}`;
      } else {
        setErrorMessage("Cannot open file from Recent view (path missing)");
        setErrorOpen(true);
        return;
      }
      window.open(`http://localhost:4000/api/files/download?path=${encodeURIComponent(filePath)}`, '_blank');
    }
  };

  const handleDeleteClick = (file: FileInfo) => {
    if (mode === 'recent') return; 
    setFileToDelete(file);
    setDeleteConfirmOpen(true);
  };

  const handleDownloadSelected = async () => {
    if (selectedFiles.size === 0) return;

    const filesToDownload = files?.filter(f => selectedFiles.has(f.name)) || [];
    if (filesToDownload.length === 0) return;

    // If single file and it's not a directory, download directly
    if (filesToDownload.length === 1 && filesToDownload[0].type === 'file') {
      handleFileOpen(filesToDownload[0]);
      return;
    }

    // Otherwise (multiple files or single directory), download as zip
    const paths = filesToDownload.map(f => {
      if (mode === 'trash') {
        return `/.trash/${f.name}`;
      }
      return currentPath === '/' ? `/${f.name}` : `${currentPath}/${f.name}`;
    });

    console.log('Requesting download for paths:', paths);

    try {
      const response = await api.post('/files/download-multiple', { paths }, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let fileName = `download_${new Date().getTime()}.zip`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2)
          fileName = fileNameMatch[1];
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
      setErrorMessage('Failed to download files');
      setErrorOpen(true);
    }
  };

  const handleDeleteSelected = () => {
    if (mode === 'recent') return;
    if (selectedFiles.size === 0) return;
    
    // We need to find FileInfo objects for selected names
    const filesToDelete = files?.filter(f => selectedFiles.has(f.name)) || [];
    if (filesToDelete.length === 0) return;

    if (confirm(`Are you sure you want to delete ${filesToDelete.length} items?`)) {
      deleteMultipleFilesMutation.mutate(filesToDelete);
    }
  };

  const handleRenameClick = (file: FileInfo) => {
    if (mode !== 'files') return; 
    setFileToRename(file);
    setRenameDialogOpen(true);
  };

  const handleRestoreSelected = () => {
    if (mode !== 'trash') return;
    if (selectedFiles.size === 0) return;

    const filesToRestore = files?.filter(f => selectedFiles.has(f.name)) || [];
    if (filesToRestore.length === 0) return;

    if (confirm(`Are you sure you want to restore ${filesToRestore.length} items?`)) {
      restoreMultipleFilesMutation.mutate(filesToRestore);
    }
  };

  const handleRestoreClick = (file: FileInfo) => {
    if (mode !== 'trash') return;
    restoreFileMutation.mutate(file);
  };

  const handleCloseError = () => {
    setErrorOpen(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => {
        uploadFileMutation.mutate(file);
      });
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const { ref: dropzoneRef, ...rootProps } = getRootProps({
    onMouseDown: handleDragMouseDown
  }) as any;

  return (
    <Box 
      {...rootProps}
      ref={(node: HTMLDivElement | null) => {
        containerRef.current = node;
        if (typeof dropzoneRef === 'function') dropzoneRef(node);
        else if (dropzoneRef) (dropzoneRef as any).current = node;
      }}
      sx={{ minHeight: 'calc(100vh - 100px)', position: 'relative' }}
    >
      <input {...getInputProps()} />
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileInputChange} 
      />
      
      {isSelecting && selectionBox && (
        <Box
          sx={{
            position: 'absolute',
            left: selectionBox.left,
            top: selectionBox.top,
            width: selectionBox.width,
            height: selectionBox.height,
            border: '1px solid rgba(25, 118, 210, 0.5)',
            backgroundColor: 'rgba(25, 118, 210, 0.1)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}

      {isDragActive && mode === 'files' && (
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flexGrow: 1 }}>
          {mode === 'files' ? (
            <BreadcrumbsNav currentPath={currentPath} onNavigate={handleNavigate} />
          ) : (
            <Box sx={{ typography: 'h6', textTransform: 'capitalize' }}>{mode}</Box>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {selectedFiles.size > 0 && mode !== 'recent' && (
            <>
              {mode === 'trash' && (
                <Button
                  variant="outlined"
                  startIcon={<RestoreFromTrashIcon />}
                  onClick={handleRestoreSelected}
                  color="inherit"
                  sx={{ borderColor: 'text.primary' }}
                >
                  Restore ({selectedFiles.size})
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadSelected}
                color="inherit"
                sx={{ borderColor: 'text.primary' }}
              >
                Download ({selectedFiles.size})
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteSelected}
              >
                Delete ({selectedFiles.size})
              </Button>
            </>
          )}

          <ButtonGroup variant="outlined" aria-label="view mode">
            <Button 
              color="primary"
              variant={viewMode === 'grid' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('grid')}
            >
              <GridViewIcon />
            </Button>
            <Button 
              color="primary"
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              onClick={() => setViewMode('list')}
            >
              <ViewListIcon />
            </Button>
          </ButtonGroup>

          {mode === 'files' && (
            <>
              <Button 
                variant="outlined" 
                startIcon={<CloudUploadIcon />}
                onClick={handleUploadClick}
                color="primary"
                sx={{ borderColor: 'text.primary' }}
              >
                Upload
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<CreateNewFolderIcon />}
                onClick={() => setCreateFolderOpen(true)}
              >
                New Folder
              </Button>
            </>
          )}
        </Box>
      </Box>

      {uploadProgress !== null && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {isLoading ? (
        <Grid container spacing={2}>
          {[...Array(8)].map((_, i) => (
            <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
              <Skeleton width="60%" sx={{ mt: 1 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          {viewMode === 'grid' ? (
            <Grid container spacing={2}>
              {files?.map((file) => (
                <Grid size={{ xs: 6, sm: 4, md: 3, lg: 2 }} key={file.name}>
                  <FileGridItem 
                    file={file} 
                    selected={selectedFiles.has(file.name)}
                    onSelect={handleFileSelect}
                    onNavigate={handleFileOpen}
                    onDelete={handleDeleteClick}
                    onRename={handleRenameClick}
                    onRestore={handleRestoreClick}
                    isTrash={mode === 'trash'}
                  />
                </Grid>
              ))}
            </Grid>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox"></TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Size</TableCell>
                    <TableCell align="right">Date</TableCell>
                    <TableCell align="right" width={50}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files?.map((file) => (
                    <FileListItem
                      key={file.name}
                      file={file}
                      selected={selectedFiles.has(file.name)}
                      onSelect={handleFileSelect}
                      onNavigate={handleFileOpen}
                      onDelete={handleDeleteClick}
                      onRename={handleRenameClick}
                      onRestore={handleRestoreClick}
                      isTrash={mode === 'trash'}
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {files?.length === 0 && (
            <Box sx={{ p: 4, width: '100%', textAlign: 'center', color: 'text.secondary' }}>
              Folder is empty. Drag and drop files to upload.
            </Box>
          )}
        </>
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