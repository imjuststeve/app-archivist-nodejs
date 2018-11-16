/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Tuesday, 2nd October 2018 2:10:15 pm
 * @Email:  developer@xyfindables.com
 * @Filename: get-blocks-by-public-key-resolver.1.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 14th November 2018 12:23:50 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { IXyoHashProvider, XyoBoundWitness } from '@xyo-network/sdk-core-nodejs';
import { XyoArchivistRepository } from "@xyo-network/sdk-archivist-nodejs";
import { XyoDataResolver } from "../@types";
import { XyoBaseDataResolver } from "../xyo-base-data-resolver";

import _ from 'lodash';
import { transformBoundWitnessToXyoBlock } from "../graphql-transformers";

export class GetAllBlocks extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

  constructor(
    private readonly archivistRepository: XyoArchivistRepository,
    protected readonly hashProvider: IXyoHashProvider
  ) {
    super(hashProvider);
  }

  public async resolve (obj: any, args: any, context: any, info: any): Promise<any> {
    const limit = Math.min((args.limit || 50), 1000) as number; // max 1000
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
      return transformBoundWitnessToXyoBlock(block, this.hashProvider);
    }));

    return blocksCollection;
  }
}
