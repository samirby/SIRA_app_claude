export interface StoredFile {
  id: string;
  name: string;
  contentType: string;
  size: number;
  url?: string;
}

export interface StorageProvider {
  upload(input: { name: string; contentType: string; data: Uint8Array }): Promise<StoredFile>;
  download(fileId: string): Promise<Uint8Array>;
  delete(fileId: string): Promise<void>;
}
