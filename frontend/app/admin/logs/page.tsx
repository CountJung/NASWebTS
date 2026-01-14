'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Stack,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  TextField,
  IconButton,
  Tooltip,
  Slider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import api from '../../../lib/api';

type LogFile = {
  path: string;
  size: number;
  updatedAt: string;
};

type LogContentResponse = {
  path: string;
  lines: number;
  content: string;
};

export default function AdminLogsPage() {
  const [files, setFiles] = useState<LogFile[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [loadingFiles, setLoadingFiles] = useState<boolean>(true);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [intervalMs, setIntervalMs] = useState(1500);
  const [tailLines, setTailLines] = useState(500);
  const [fontSize, setFontSize] = useState(12);

  const preRef = useRef<HTMLPreElement | null>(null);

  const sortedFiles = useMemo(() => files, [files]);

  const fetchFiles = async () => {
    setLoadingFiles(true);
    setError('');
    try {
      const res = await api.get<LogFile[]>('/system/logs');
      setFiles(res.data);
      if (!selected && res.data.length > 0) {
        setSelected(res.data[0].path);
      }
    } catch (e: any) {
      setError('로그 파일 목록을 불러오지 못했습니다. (관리자 권한/백엔드 상태 확인)');
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchContent = async (logPath: string) => {
    if (!logPath) return;
    setLoadingContent(true);
    setError('');
    try {
      const res = await api.get<LogContentResponse>('/system/logs/content', {
        params: { path: logPath, lines: tailLines },
      });
      setContent(res.data.content || '');
    } catch (e: any) {
      setError('로그 내용을 불러오지 못했습니다.');
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('adminLogsFontSize');
      if (saved) {
        const n = Number(saved);
        if (Number.isFinite(n)) setFontSize(Math.max(10, Math.min(24, Math.floor(n))));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('adminLogsFontSize', String(fontSize));
    } catch {
      // ignore
    }
  }, [fontSize]);

  useEffect(() => {
    if (!selected) return;
    fetchContent(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, tailLines]);

  useEffect(() => {
    if (!autoRefresh || !selected) return;

    const ms = Math.max(500, Math.min(10000, intervalMs || 1500));
    const id = window.setInterval(() => {
      fetchContent(selected);
    }, ms);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, selected, intervalMs, tailLines]);

  useEffect(() => {
    if (!preRef.current) return;
    // auto scroll to bottom when content updates
    preRef.current.scrollTop = preRef.current.scrollHeight;
  }, [content]);

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">관리자 로그 뷰어</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="로그 목록 새로고침">
            <IconButton onClick={fetchFiles} disabled={loadingFiles}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Paper sx={{ width: { xs: '100%', md: 360 }, p: 1, maxHeight: { md: '70vh' }, overflow: 'auto' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, pb: 1 }}>
            <Typography variant="subtitle1">로그 파일</Typography>
            {loadingFiles && <CircularProgress size={18} />}
          </Stack>
          <Divider />
          <List dense>
            {sortedFiles.map((f) => (
              <ListItemButton
                key={f.path}
                selected={selected === f.path}
                onClick={() => setSelected(f.path)}
              >
                <ListItemText
                  primary={f.path}
                  secondary={new Date(f.updatedAt).toLocaleString()}
                />
              </ListItemButton>
            ))}
            {!loadingFiles && sortedFiles.length === 0 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  logs 폴더에 로그 파일이 없습니다.
                </Typography>
              </Box>
            )}
          </List>
        </Paper>

        <Paper sx={{ flex: 1, p: 2, maxHeight: { md: '70vh' }, overflow: 'hidden' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <FormControlLabel
              control={<Switch checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />}
              label="자동 새로고침"
            />
            <Box sx={{ minWidth: 180, px: 1 }}>
              <Typography variant="caption" color="text.secondary">
                폰트 크기: {fontSize}px
              </Typography>
              <Slider
                size="small"
                value={fontSize}
                min={10}
                max={24}
                step={1}
                onChange={(_, v) => setFontSize(Array.isArray(v) ? v[0] : v)}
                aria-label="log font size"
              />
            </Box>
            <TextField
              label="주기(ms)"
              size="small"
              type="number"
              value={intervalMs}
              onChange={(e) => setIntervalMs(Number(e.target.value))}
              sx={{ width: 140 }}
              inputProps={{ min: 500, max: 10000 }}
            />
            <TextField
              label="Tail lines"
              size="small"
              type="number"
              value={tailLines}
              onChange={(e) => setTailLines(Number(e.target.value))}
              sx={{ width: 140 }}
              inputProps={{ min: 10, max: 5000 }}
            />
            <Box sx={{ flex: 1 }} />
            <Tooltip title="현재 선택 파일 새로고침">
              <span>
                <IconButton onClick={() => fetchContent(selected)} disabled={!selected || loadingContent}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">{selected || '파일을 선택하세요'}</Typography>
            {loadingContent && <CircularProgress size={18} />}
          </Stack>

          <Box
            component="pre"
            ref={preRef}
            sx={{
              m: 0,
              p: 2,
              borderRadius: 1,
              bgcolor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              height: { xs: '55vh', md: '58vh' },
              overflow: 'auto',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              fontSize,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {content || (selected ? '내용이 없습니다.' : '좌측에서 로그 파일을 선택하세요.')}
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}
