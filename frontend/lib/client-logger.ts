import api from './api';

interface LogData {
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  user?: string;
  [key: string]: unknown;
}

function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack || error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

class ClientLogger {
  private logToBackend(level: 'error' | 'info', data: LogData) {
    // Prevent infinite loops if logging fails
    try {
      const payload = {
        ...data,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      };
      
      // Use sendBeacon if available for better reliability on page unload
      // But for general logging, axios is fine. 
      // We use api instance to reuse base URL configuration
      api.post(`/logs/${level}`, payload).catch((err: unknown) => {
        console.error('Failed to send log to backend', err);
      });
    } catch (e) {
      console.error('Logger error', e);
    }
  }

  error(message: string, error?: unknown, user?: string) {
    console.error(message, error);
    this.logToBackend('error', {
      message,
      stack: serializeError(error),
      user,
    });
  }

  info(message: string, data?: unknown, user?: string) {
    console.log(message, data);
    this.logToBackend('info', {
      message,
      data,
      user,
    });
  }
}

export const clientLogger = new ClientLogger();
