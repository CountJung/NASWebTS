import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuditService, FileActionType } from './audit.service';

function inferAction(handlerName: string): FileActionType {
  switch (handlerName) {
    case 'listFiles':
      return 'LIST';
    case 'getRecentFiles':
      return 'RECENT';
    case 'getTrashFiles':
      return 'TRASH';
    case 'downloadFile':
      return 'DOWNLOAD';
    case 'downloadMultipleFiles':
      return 'DOWNLOAD_MULTIPLE';
    case 'uploadFile':
      return 'UPLOAD';
    case 'createDirectory':
      return 'MKDIR';
    case 'deleteFile':
      return 'DELETE';
    case 'renameFile':
      return 'RENAME';
    case 'restoreFile':
      return 'RESTORE';
    case 'restoreMultipleFiles':
      return 'RESTORE_MULTIPLE';
    default:
      return 'LIST';
  }
}

@Injectable()
export class FileAuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest();
    const handlerName = context.getHandler().name;
    const action = inferAction(handlerName);

    const start = Date.now();

    const user = req.user || {};
    const ip = req.ip;
    const userAgent = req.headers?.['user-agent'];

    const queryPath = req.query?.path;
    const bodyPath = req.body?.path;
    const bodyPaths = req.body?.paths;
    const bodyFileName = req.body?.fileName;
    const fileSize = req.file?.size;

    const eventBase = {
      action,
      userId: user.userId,
      email: user.email,
      role: user.role,
      ip,
      userAgent,
      path: (typeof queryPath === 'string' && queryPath) || (typeof bodyPath === 'string' && bodyPath) || undefined,
      paths: Array.isArray(bodyPaths) ? bodyPaths : undefined,
      fileName: typeof bodyFileName === 'string' ? bodyFileName : (req.file?.originalname || undefined),
      fileSize: typeof fileSize === 'number' ? fileSize : undefined,
    };

    return next.handle().pipe(
      tap(() => {
        this.auditService.logFileAction({
          ...eventBase,
          success: true,
          durationMs: Date.now() - start,
        });
      }),
      catchError((err) => {
        this.auditService.logFileAction({
          ...eventBase,
          success: false,
          durationMs: Date.now() - start,
          errorMessage: err?.message || String(err),
        });
        return throwError(() => err);
      }),
    );
  }
}
