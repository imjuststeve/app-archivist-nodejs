/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 24th September 2018 11:31:19 am
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-archivist-local-storage-repository.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Monday, 24th September 2018 11:51:03 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoArchivistRepository } from ".";
import { XyoHash, XyoBoundWitness, XyoPacker, XyoObject, XyoOriginBlockLocalStorageRepository } from "xyo-sdk-core";

export class XyoArchivistLocalStorageRepository implements XyoArchivistRepository {

  constructor (
    private readonly originBlockLocalStorageRepository: XyoOriginBlockLocalStorageRepository,
    private readonly xyoPacker: XyoPacker) {
  }

  public removeOriginBlock(hash: Buffer): Promise<void> {
    return this.originBlockLocalStorageRepository.removeOriginBlock(hash);
  }

  public containsOriginBlock(hash: Buffer): Promise<boolean> {
    return this.originBlockLocalStorageRepository.containsOriginBlock(hash);
  }

  public getAllOriginBlockHashes(): Promise<Buffer[]> {
    return this.originBlockLocalStorageRepository.getAllOriginBlockHashes();
  }

  public addOriginBlock(hash: XyoHash, originBlock: XyoBoundWitness): Promise<void> {
    return this.originBlockLocalStorageRepository.addOriginBlock(hash, originBlock);
  }

  public getOriginBlockByHash(hash: Buffer): Promise<XyoBoundWitness | undefined> {
    return this.originBlockLocalStorageRepository.getOriginBlockByHash(hash);
  }

  public async getOriginBlocksWithPublicKey(publicKey: XyoObject): Promise<XyoBoundWitness[]> {
    const allOriginBlockHashes = await this.getAllOriginBlockHashes();
    const originBlocks = await Promise.all(allOriginBlockHashes.map((hash) => {
      return this.getOriginBlockByHash(hash);
    }));

    const publicKeyBytes = this.xyoPacker.serialize(publicKey, publicKey.major, publicKey.minor, true);

    const filteredOriginBlocks = originBlocks.filter((originBlock) => {
      if (!originBlock) {
        return false;
      }

      return originBlock.publicKeys.filter((publicKeySet) => {
        return publicKeySet.array.filter((pk) => {
          const serializedTypedPublicKey = this.xyoPacker.serialize(pk, pk.major, pk.minor, true);
          return serializedTypedPublicKey.equals(publicKeyBytes);
        })
        .length > 0;
      })
      .length > 0;
    });

    return filteredOriginBlocks as XyoBoundWitness[];
  }
}
