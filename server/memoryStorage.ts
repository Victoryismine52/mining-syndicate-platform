import { Readable } from 'stream';

interface StoredObject {
  data: Buffer;
  metadata: { contentType?: string };
}

class MemoryFile {
  constructor(private store: Map<string, StoredObject>, private key: string) {}

  async exists(): Promise<[boolean]> {
    return [this.store.has(this.key)];
  }

  async getMetadata(): Promise<[StoredObject['metadata'] & { size: number }]> {
    const obj = this.store.get(this.key);
    return [{ contentType: obj?.metadata.contentType, size: obj?.data.length ?? 0 }];
  }

  createReadStream() {
    const obj = this.store.get(this.key);
    return Readable.from(obj?.data ?? Buffer.alloc(0));
  }

  async save(data: Buffer | string, options?: { contentType?: string }) {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    this.store.set(this.key, { data: buf, metadata: { contentType: options?.contentType } });
  }

  async download(): Promise<[Buffer]> {
    const obj = this.store.get(this.key);
    return [obj?.data ?? Buffer.alloc(0)];
  }
}

class MemoryBucket {
  constructor(private store: Map<string, StoredObject>, private name: string) {}

  file(objectName: string) {
    const key = `${this.name}/${objectName}`;
    return new MemoryFile(this.store, key);
  }
}

export class MemoryStorage {
  private store = new Map<string, StoredObject>();

  bucket(name: string) {
    return new MemoryBucket(this.store, name);
  }
}

export type { MemoryBucket, MemoryFile };
