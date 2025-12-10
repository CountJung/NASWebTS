'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { clientLogger } from '../lib/client-logger';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    clientLogger.error('Uncaught error in React component', {
      error,
      componentStack: errorInfo.componentStack,
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100vh"
          p={3}
        >
          <Typography variant="h4" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            An unexpected error occurred. Our team has been notified.
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
