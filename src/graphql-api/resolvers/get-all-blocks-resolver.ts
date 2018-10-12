/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Tuesday, 2nd October 2018 2:10:15 pm
 * @Email:  developer@xyfindables.com
 * @Filename: get-blocks-by-public-key-resolver.1.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 11th October 2018 5:37:26 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { IXyoHashProvider, XyoBoundWitness } from "@xyo-network/sdk-core-nodejs";
import { XyoArchivistRepository } from "../../xyo-archivist-repository";
import { XyoDataResolver } from "..";
import { XyoBaseDataResolver } from "../xyo-base-data-resolver";

import _ from 'lodash';

export class GetAllBlocks extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

  constructor(
    private readonly archivistRepository: XyoArchivistRepository,
    protected readonly hashProvider: IXyoHashProvider
  ) {
    super(hashProvider);
  }

  public async resolve (obj: any, args: any, context: any, info: any): Promise<any> {
    const limit = (args.limit || 50) as number;
    const offset = (args.offset || 0) as number;

    const blockHashes = await this.archivistRepository.getAllOriginBlockHashes();

    const paginatedBlocks = await Promise.all(_.chain(blockHashes)
      .drop(offset)
      .take(limit)
      .map((blockHash) => {
        return this.archivistRepository.getOriginBlockByHash(blockHash) as Promise<XyoBoundWitness>;
      })
      .value());

    const blocksCollection = await Promise.all(paginatedBlocks.map(async (block) => {
      const { hash, bytes, major, minor } = await this.getHashBytesMajorMinor(block);

      return {
        hash,
        bytes,
        major,
        minor,
        payloads: await this.getPayloads(block),
        publicKeys: await this.getPublicKeys(block),
        signatures: await this.getSignatures(block)
      };
    }));

    return blocksCollection;
  }

  private async getPayloads(block: XyoBoundWitness) {
    return Promise.all(block.payloads.map(async (payload) => {
      const { hash, bytes, major, minor } = await this.getHashBytesMajorMinor(payload);
      return {
        hash,
        bytes,
        major,
        minor,
        signedPayload: await Promise.all(payload.signedPayload.array.map(async (signedPayloadItem) => {
          return this.getHashBytesMajorMinor(signedPayloadItem);
        })),
        unsignedPayload: await Promise.all(payload.unsignedPayload.array.map(async (unsignedPayloadItem) => {
          return this.getHashBytesMajorMinor(unsignedPayloadItem);
        }))
      };
    }));
  }

  private async getPublicKeys(block: XyoBoundWitness) {
    return Promise.all(block.publicKeys.map(async (publicKeySet) => {
      const { hash, bytes, major, minor } = await this.getHashBytesMajorMinor(publicKeySet);

      return {
        hash,
        bytes,
        major,
        minor,
        array: await Promise.all(publicKeySet.array.map(async (publicKey) => {
          return this.getHashBytesMajorMinor(publicKey);
        }))
      };
    }));
  }

  private async getSignatures(block: XyoBoundWitness) {
    return Promise.all(block.signatures.map(async (signatureSet) => {
      const { hash, bytes, major, minor } = await this.getHashBytesMajorMinor(signatureSet);

      return {
        hash,
        bytes,
        major,
        minor,
        array: await Promise.all(
          signatureSet.array.map(async (signature) => {
            return this.getHashBytesMajorMinor(signature);
          })
        )
      };
    }));
  }
}
