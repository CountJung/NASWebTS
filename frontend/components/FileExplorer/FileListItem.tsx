'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import { FileInfo } from '@/types/file';
import { format } from 'date-fns';

interface FileListItemProps {
  file: FileInfo;
  selected: boolean;
  onSelect: (file: FileInfo, multi: boolean) => void;
  onNavigate: (file: FileInfo) => void;
  onDelete: (file: FileInfo) => void;
  onRename: (file: FileInfo) => void;
  onRestore?: (file: FileInfo) => void;
  isTrash?: boolean;
}

export default function FileListItem({ 
  file, 
  selected, 
  onSelect, 
  onNavigate, 
  onDelete, 
  onRename,
  onRestore,
  isTrash
}: FileListItemProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(null);
  };

  const handleDelete = (event: React.MouseEvent<HTMLElement>) => {
    handleClose(event);
    onDelete(file);
  };

  const handleRename = (event: React.MouseEvent<HTMLElement>) => {
    handleClose(event);
    onRename(file);
  };

  const handleRestore = (event: React.MouseEvent<HTMLElement>) => {
    handleClose(event);
    if (onRestore) onRestore(file);
  };

  const handleClick = (event: React.MouseEvent) => {
    onSelect(file, event.ctrlKey || event.metaKey);
  };

  const handleDoubleClick = (event: React.MouseEvent) => {
    onNavigate(file);
  };

  return (
    <TableRow
      hover
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      selected={selected}
      sx={{ 
        cursor: 'pointer',
        '&.Mui-selected': { backgroundColor: 'action.selected' },
        '&.Mui-selected:hover': { backgroundColor: 'action.selected' }
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          color="primary"
          checked={selected}
          onChange={(e) => {
            // Checkbox click always toggles, but we treat it as multi-select add/remove usually
            // Or we can just let the row click handle it. 
            // If we click checkbox specifically, we probably want to toggle without clearing others?
            // Let's just pass true for multi to toggle.
            onSelect(file, true); 
          }}
          onClick={(e) => e.stopPropagation()}
        />
      </TableCell>
      <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ mr: 2, color: file.type === 'directory' ? 'primary.main' : 'text.secondary', display: 'flex' }}>
          {file.type === 'directory' ? <FolderIcon /> : <InsertDriveFileIcon />}
        </Box>
        <Typography variant="body2">{file.name}</Typography>
      </TableCell>
      <TableCell align="right">
        {file.type === 'directory' ? '-' : `${(file.size / 1024).toFixed(1)} KB`}
      </TableCell>
      <TableCell align="right">
        {format(new Date(file.updatedAt), 'yyyy-MM-dd HH:mm')}
      </TableCell>
      <TableCell align="right" padding="none">
        <IconButton
          aria-label="more"
          onClick={handleMenuClick}
          size="small"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          onClick={(e) => e.stopPropagation()}
        >
          {isTrash ? (
            <MenuItem onClick={handleRestore}>Restore</MenuItem>
          ) : (
            <MenuItem onClick={handleRename}>Rename</MenuItem>
          )}
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Delete</MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
}
