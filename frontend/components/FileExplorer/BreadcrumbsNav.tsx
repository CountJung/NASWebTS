'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';

interface BreadcrumbsNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function BreadcrumbsNav({ currentPath, onNavigate }: BreadcrumbsNavProps) {
  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <Box sx={{ mb: 2 }}>
      <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
        <Link
          underline="hover"
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          color="text.primary"
          onClick={() => onNavigate('/')}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        {pathParts.map((part, index) => {
          const path = '/' + pathParts.slice(0, index + 1).join('/');
          const isLast = index === pathParts.length - 1;

          return isLast ? (
            <Typography key={path} color="text.primary">
              {part}
            </Typography>
          ) : (
            <Link
              key={path}
              underline="hover"
              color="inherit"
              sx={{ cursor: 'pointer' }}
              onClick={() => onNavigate(path)}
            >
              {part}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}