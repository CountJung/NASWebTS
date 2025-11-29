export interface FileInfo {
  name: string;
  type: 'file' | 'directory';
  size: number;
  createdAt: string;
  updatedAt: string;
}