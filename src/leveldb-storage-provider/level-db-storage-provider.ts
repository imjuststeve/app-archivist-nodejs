import { XYOStorageProvider, XyoError, XyoStoragePriority } from "@xyo-network/sdk-core-nodejs";

import levelup, { LevelUp } from 'levelup';
import leveldown, { LevelDown } from 'leveldown';

export class XyoLevelDbStorageProvider implements XYOStorageProvider {

  private db: LevelUp<LevelDown>;

  constructor (private readonly levelDbDirectory: string) {
    this.db = levelup(leveldown(levelDbDirectory));
  }

  public async write(
    key: Buffer,
    value: Buffer,
    priority: XyoStoragePriority,
    cache: boolean,
    timeout: number
  ): Promise<XyoError | undefined> {
    return new Promise((resolve, reject) => {
      this.db.put(key, value, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve();
      });
    }) as Promise<undefined>;
  }

  public async read(key: Buffer, timeout: number): Promise<Buffer | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(key, (err, value) => {
        if (err) {
          return reject(err);
        }

        return resolve(value as Buffer);
      });
    }) as Promise<Buffer | undefined>;
  }

  public async getAllKeys(): Promise<Buffer[]> {
    return new Promise((resolve, reject) => {
      const keys: Buffer[] = [];
      const keyStream = this.db.createKeyStream()
        .on('data', (data) => {
          keys.push(data as Buffer);
        })
        .on('end', () => {
          return resolve(keys);
        });

    }) as Promise<Buffer[]>;
  }

  public async delete(key: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.del(key, (err) => {
        if (err) {
          return reject(err);
        }

        return resolve(undefined);
      });
    }) as Promise<void>;
  }

  public async containsKey(key: Buffer): Promise<boolean> {
    try {
      const value = await this.read(key, 60000);
      return Boolean(value);
    } catch (err) {
      if (err.notFound) {
        return false;
      }

      throw err;
    }
  }

}
