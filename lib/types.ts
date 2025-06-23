export interface FileEntry {
  name: string;
  type: 'file' | 'directory';
  permissions?: string;
  size?: number;
  date?: string;
}