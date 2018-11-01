/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 24th September 2018 11:31:19 am
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-archivist-local-storage-repository.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 1st November 2018 11:24:08 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoArchivistRepository, XyoOriginBlocksByPublicKeyResult } from ".";

import {
  XyoHash,
  XyoBoundWitness,
  XyoObject,
  IXyoOriginBlockRepository,
  IXyoStorageProvider,
  XyoPreviousHash,
  XyoNextPublicKey,
  XyoKeySet,
  XyoStoragePriority,
  XyoBase,
  IXyoPublicKey,
  IOriginBlockQueryResult
} from "@xyo-network/sdk-core-nodejs";

import _ from 'lodash';

export class XyoArchivistLocalStorageRepository extends XyoBase implements XyoArchivistRepository {

  private usePublicKeysIndexStorageProvider: boolean = true;
  private onPublicKeysIndexMissUseScan: boolean = true;

  constructor (
    private readonly originBlockRepository: IXyoOriginBlockRepository,
    private readonly publicKeyStore: IXyoStorageProvider
  ) {
    super();
  }

  public removeOriginBlock(hash: Buffer): Promise<void> {
    return this.originBlockRepository.removeOriginBlock(hash);
  }

  public containsOriginBlock(hash: Buffer): Promise<boolean> {
    return this.originBlockRepository.containsOriginBlock(hash);
  }

  public getAllOriginBlockHashes(): Promise<Buffer[]> {
    return this.originBlockRepository.getAllOriginBlockHashes();
  }

  public async addOriginBlock(hash: XyoHash, originBlock: XyoBoundWitness): Promise<void> {
    this.logInfo(`Adding origin block`);
    await this.originBlockRepository.addOriginBlock(hash, originBlock);
    if (!this.usePublicKeysIndexStorageProvider) {
      return;
    }

    this.updateRelevantPublicKeyIndexes(hash, originBlock);
  }

  public async getOriginBlocks(limit: number, offsetHash?: Buffer | undefined): Promise<IOriginBlockQueryResult> {
    return this.originBlockRepository.getOriginBlocks(limit, offsetHash);
  }

  public getOriginBlockByHash(hash: Buffer): Promise<XyoBoundWitness | undefined> {
    return this.originBlockRepository.getOriginBlockByHash(hash);
  }

  public async getEntities(): Promise<IXyoPublicKey[]> {
    const allKeys = await this.publicKeyStore.getAllKeys();
    const publicKeys = await Promise.all(allKeys.map(async (key) => {
      const value = await this.publicKeyStore.read(key, 60000);
      const indexItem = this.transformPublicKeyValueToXyoPublicKeyIndexItem(value);
      if (!indexItem) {
        return undefined;
      }

      if (indexItem.parentPublicKeyIndex) {
        return undefined;
      }

      return XyoObject.deserialize<IXyoPublicKey>(key);
    }));

    return publicKeys.filter(pk => pk) as IXyoPublicKey[];
  }

  public async getOriginBlocksByPublicKey(publicKey: IXyoPublicKey): Promise<XyoOriginBlocksByPublicKeyResult> {
    if (!this.usePublicKeysIndexStorageProvider) {
      const scanResult = await this.getOriginBlocksByPublicKeyByScan(publicKey);
      return {
        publicKeys: [publicKey],
        boundWitnesses: scanResult
      };
    }

    const indexItem = await this.getPublicKeyIndexItem(publicKey);
    if (!indexItem) {
      if (this.onPublicKeysIndexMissUseScan) {
        const result = await this.getOriginBlocksByPublicKeyByScan(publicKey);
        return {
          publicKeys: [publicKey],
          boundWitnesses: result
        };
      }

      return { publicKeys: [publicKey], boundWitnesses: [] };
    }

    // Add all hashes to hashmap
    const hashMap: {[s: string]: boolean} = {};

    // Add all other public keys to publicKeyMap
    const publicKeyMap: {[s: string]: boolean} = {};
    publicKeyMap[publicKey.serialize(true).toString('hex')] = true;

    await this.gatherHashesFromPublicKeyTree(indexItem, hashMap, publicKeyMap);

    const getOriginBlocksPromises = _.chain(hashMap)
      .keys()
      .map(async (hashKey) => {
        const hash = Buffer.from(hashKey, 'hex');
        const originBlock = await this.getOriginBlockByHash(hash);
        return originBlock;
      })
      .value();

    const originBlocks = await Promise.all(getOriginBlocksPromises);
    const filteredOriginBlocks = _.chain(originBlocks).filter().value() as XyoBoundWitness[]; // remove undefined
    const publicKeySet = _.chain(publicKeyMap)
      .reduce((publicKeyCollection, val, publicKeyItem) => {
        publicKeyCollection.push(XyoObject.deserialize(Buffer.from(publicKeyItem, 'hex')));
        return publicKeyCollection;
      }, [] as XyoObject[])
      .value();

    return {
      publicKeys: publicKeySet,
      boundWitnesses: filteredOriginBlocks
    };
  }

  private async updateRelevantPublicKeyIndexes(hash: XyoHash, originBlock: XyoBoundWitness) {
    await Promise.all(originBlock.publicKeys.map(async (publicKeySet, positionalIndex) => {
      let previousBlock: XyoBoundWitness | undefined;
      const previousHash = originBlock
        .payloads[positionalIndex]
        .signedPayload.array.find(
          (signedPayloadItem) => {
            return signedPayloadItem.id.equals(Buffer.from([XyoPreviousHash.major, XyoPreviousHash.minor]));
          }
      ) as XyoPreviousHash | undefined;

      if (previousHash) {
        const hashBuffer = previousHash.hash.serialize(true);

        previousBlock = await this.getOriginBlockByHash(hashBuffer);
      }

      const indexPublicKeys = await Promise.all(publicKeySet.array.map(async (publicKey) => {
        const key = publicKey.serialize(true);
        let indexItem = await this.getPublicKeyIndexItem(publicKey);

        if (!indexItem) {
          indexItem = {
            hashes: [],
            parentPublicKeyIndex: null,
            otherPublicKeys: []
          };

          if (previousBlock) {
            let previousBlockPublicKeySet: XyoKeySet | undefined;
            let previousBlockPositionalIndex = -1;
            for (const payload of previousBlock.payloads) {
              previousBlockPositionalIndex += 1;
              for (const signedPayloadItem of payload.signedPayload.array) {
                if (signedPayloadItem.id.equals(Buffer.from([XyoNextPublicKey.major, XyoNextPublicKey.minor]))) {
                  const previousBlockPublicKey = (signedPayloadItem as XyoNextPublicKey).publicKey;
                  const serializedPreviousBlockPublicKey = previousBlockPublicKey.serialize(true);

                  if (serializedPreviousBlockPublicKey.equals(key)) {
                    previousBlockPublicKeySet = previousBlock.publicKeys[previousBlockPositionalIndex];
                    break;
                  }
                }
              }
              if (previousBlockPublicKeySet) {
                break;
              }
            }

            if (previousBlockPublicKeySet) {
              const previousIndexItem = await previousBlockPublicKeySet.array.reduce(
                async (promiseChain, previousBlockPublicKey) => {
                  let resultKey = previousBlockPublicKey;
                  const foundValue = await promiseChain;
                  if (foundValue) {
                    return foundValue;
                  }

                  let result = await this.getPublicKeyIndexItem(previousBlockPublicKey);
                  if (result) {
                    if (result.parentPublicKeyIndex) {
                      const parentPublicIndexKey = XyoObject.deserialize(
                        Buffer.from(result.parentPublicKeyIndex, 'hex')
                      ) as IXyoPublicKey;
                      const parentResult = await this.getPublicKeyIndexItem(parentPublicIndexKey);
                      result = parentResult || result;
                      resultKey = parentResult ? parentPublicIndexKey : resultKey;
                    }

                    return {
                      index: result,
                      key: resultKey
                    };
                  }
                }, Promise.resolve(undefined) as Promise<{index: XyoPublicKeyIndexItem, key: IXyoPublicKey} | undefined>
              );

              if (previousIndexItem) {
                indexItem.parentPublicKeyIndex = previousIndexItem.index.parentPublicKeyIndex ||
                  previousIndexItem.key.serialize(true).toString('hex');

                previousIndexItem.index.otherPublicKeys.push(key.toString('hex'));

                await this.updatePublicKeyIndex(previousIndexItem.key, previousIndexItem.index);
              }
            }
          }
        }

        const serializedHash = hash.serialize(true).toString('hex');
        indexItem.hashes.push(serializedHash);
        await this.updatePublicKeyIndex(publicKey, indexItem);
      }));

      return indexPublicKeys;
    }));

    this.logInfo(`Finished adding origin block`);
  }

  private async gatherHashesFromPublicKeyTree(
    indexItem: XyoPublicKeyIndexItem,
    hashMap: {[s: string]: boolean},
    publicKeyMap: {[s: string]: boolean} = {}
  ) {

    indexItem.hashes.reduce((hashAggregator, hash) => {
      hashAggregator[hash] = true;
      return hashAggregator;
    }, hashMap);

    const publicKeysToTraverse = ([] as string[]).concat(indexItem.otherPublicKeys);
    if (indexItem.parentPublicKeyIndex) {
      publicKeysToTraverse.push(indexItem.parentPublicKeyIndex);
    }

    const downstreamPublicKeys = publicKeysToTraverse.reduce((publicKeyCollection, otherPublicKey) => {
      if (publicKeyMap[otherPublicKey] === undefined) {
        publicKeyMap[otherPublicKey] = true;  // set to false because it hasn't been looked up yet
        publicKeyCollection.push(otherPublicKey);
      }

      return publicKeyCollection;
    }, [] as string[]);

    await Promise.all(downstreamPublicKeys.map(async (downstreamPublicKey) => {
      const downstreamPublicKeyObject = XyoObject.deserialize(
        Buffer.from(downstreamPublicKey, 'hex')
      ) as IXyoPublicKey;
      const downstreamIndexItem = await this.getPublicKeyIndexItem(downstreamPublicKeyObject);
      if (downstreamIndexItem) {
        await this.gatherHashesFromPublicKeyTree(downstreamIndexItem, hashMap, publicKeyMap);
      }
    }));
  }

  private async getOriginBlocksByPublicKeyByScan(publicKey: XyoObject) {
    const allOriginBlockHashes = await this.getAllOriginBlockHashes();
    const originBlocks = await Promise.all(allOriginBlockHashes.map((hash) => {
      return this.getOriginBlockByHash(hash);
    }));

    const publicKeyBytes = publicKey.serialize(true);

    const filteredOriginBlocks = originBlocks.filter((originBlock) => {
      if (!originBlock) {
        return false;
      }

      return originBlock.publicKeys.filter((publicKeySet) => {
        return publicKeySet.array.filter((pk) => {
          const serializedTypedPublicKey = pk.serialize(true);
          return serializedTypedPublicKey.equals(publicKeyBytes);
        })
        .length > 0;
      })
      .length > 0;
    });

    return filteredOriginBlocks as XyoBoundWitness[];
  }

  private async getPublicKeyIndexItem(publicKey: IXyoPublicKey): Promise<XyoPublicKeyIndexItem | undefined> {
    const key = publicKey.serialize(true);
    const hasKey = await this.publicKeyStore.containsKey(key);

    if (hasKey) {
      const value = await this.publicKeyStore.read(key, 60000);
      return this.transformPublicKeyValueToXyoPublicKeyIndexItem(value);
    }

    return undefined;
  }

  private transformPublicKeyValueToXyoPublicKeyIndexItem(value: Buffer | undefined): XyoPublicKeyIndexItem | undefined {
    if (value) {
      const strValue = value.toString();
      return JSON.parse(strValue) as XyoPublicKeyIndexItem;
    }

    return undefined;
  }

  private async updatePublicKeyIndex(publicKey: IXyoPublicKey, indexItem: XyoPublicKeyIndexItem) {
    const key = publicKey.serialize(true);
    const jsonValue = XyoBase.stringify(indexItem);
    const value = Buffer.from(jsonValue);

    await this.publicKeyStore.write(key, value, XyoStoragePriority.PRIORITY_MED, true, 60000);
  }
}

interface XyoPublicKeyIndexItem {
  hashes: string[];
  parentPublicKeyIndex: string | null;
  otherPublicKeys: string[];
}
