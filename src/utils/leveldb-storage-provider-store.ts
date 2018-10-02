/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Friday, 28th September 2018 2:08:48 pm
 * @Email:  developer@xyfindables.com
 * @Filename: leveldb-storage-provider-store.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Tuesday, 2nd October 2018 11:19:45 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoLevelDbStorageProvider } from "../leveldb-storage-provider/level-db-storage-provider";

const cache: { [s: string]: XyoLevelDbStorageProvider } = {};

export function getLevelDbStore(storeLocation: string) {
  const store = cache[storeLocation];
  if (store) {
    return store;
  }

  const newStore = new XyoLevelDbStorageProvider(storeLocation);
  cache[storeLocation] = newStore;
  return newStore;
}
