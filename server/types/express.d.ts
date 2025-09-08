declare namespace Express {
  export interface Request {
    imagePath?: string;
    storageOptions?: import('../../shared/types/storage').StorageOptions;
  }
}
