'use client';

import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import { FileInfo } from '@/types/file';

interface FileGridItemProps {
  file: FileInfo;
  selected: boolean;
  onSelect: (file: FileInfo, multi: boolean) => void;
  onNavigate: (file: FileInfo) => void;
  onDelete: (file: FileInfo) => void;
  onRename: (file: FileInfo) => void;
  onRestore?: (file: FileInfo) => void;
  isTrash?: boolean;
}

export default function FileGridItem({ 
  file, 
  selected, 
  onSelect, 
  onNavigate, 
  onDelete, 
  onRename,
  onRestore,
  isTrash
}: FileGridItemProps) {
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
    <Card 
      sx={{ 
        cursor: 'pointer', 
        bgcolor: 'background.paper',
        backgroundImage: (theme) => selected 
          ? `linear-gradient(${theme.palette.action.selected}, ${theme.palette.action.selected})` 
          : 'none',
        '&:hover': { 
          borderColor: 'primary.main',
          backgroundImage: (theme) => selected 
            ? `linear-gradient(${theme.palette.action.selected}, ${theme.palette.action.selected}), linear-gradient(${theme.palette.action.hover}, ${theme.palette.action.hover})`
            : `linear-gradient(${theme.palette.action.hover}, ${theme.palette.action.hover})`
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        position: 'relative',
        border: 1,
        borderColor: selected ? 'primary.main' : 'divider'
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <Checkbox
        checked={selected}
        onChange={(e) => onSelect(file, true)}
        onClick={(e) => e.stopPropagation()}
        sx={{ 
          position: 'absolute', 
          top: 4, 
          left: 4,
          display: selected ? 'flex' : 'none',
          '.MuiCard-root:hover &': { display: 'flex' }
        }}
        size="small"
      />

      <IconButton
        aria-label="more"
        id={`long-button-${file.name}`}
        aria-controls={open ? `long-menu-${file.name}` : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleMenuClick}
        sx={{ position: 'absolute', top: 4, right: 4 }}
        size="small"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        id={`long-menu-${file.name}`}
        MenuListProps={{
          'aria-labelledby': `long-button-${file.name}`,
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {isTrash ? (
          <MenuItem onClick={handleRestore}>Restore</MenuItem>
        ) : (
          <MenuItem onClick={handleRename}>Rename</MenuItem>
        )}
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Delete</MenuItem>
      </Menu>

      <Box sx={{ fontSize: 60, color: file.type === 'directory' ? 'primary.main' : 'text.secondary' }}>
        {file.type === 'directory' ? <FolderIcon fontSize="inherit" /> : <InsertDriveFileIcon fontSize="inherit" />}
      </Box>
      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, width: '100%', textAlign: 'center' }}>
        <Typography variant="body2" noWrap title={file.name}>
          {file.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {file.type === 'directory' ? '-' : `${(file.size / 1024).toFixed(1)} KB`}
        </Typography>
      </CardContent>
    </Card>
  );
}