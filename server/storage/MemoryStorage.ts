import { File } from "@google-cloud/storage";
import { Readable } from "stream";
import { StorageError } from '@shared/types/storage';

interface FileMetadata {
  contentType: string;
  size: number;
  [key: string]: any;
}

export class MemoryFile implements Partial<File> {
  private content?: Buffer;

  constructor(private store: Map<string, Buffer>, private key: string) {}

  async exists(): Promise<[boolean]> {
    return [this.store.has(this.key)];
  }

  async getMetadata(): Promise<[FileMetadata, any]> {
    const data = this.store.get(this.key);
    if (!data) throw new StorageError('NOT_FOUND', "File not found");
    return [{ contentType: "application/octet-stream", size: data.length }, {}];
  }

  createReadStream() {
    const data = this.store.get(this.key) || Buffer.alloc(0);
    return Readable.from(data);
  }

  async delete(): Promise<[any]> {
    this.store.delete(this.key);
    return [{}];
  }

  async save(data: Buffer) {
    this.store.set(this.key, data);
  }
}

export class MemoryBucket {
  constructor(private store: Map<string, Buffer>, private name: string) {}

  file(objectName: string): MemoryFile {
    const key = `${this.name}/${objectName}`;
    return new MemoryFile(this.store, key);
  }
}

export class MemoryStorage {
  private store = new Map<string, Buffer>();

  bucket(name: string): MemoryBucket {
    return new MemoryBucket(this.store, name);
  }
}
