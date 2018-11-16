/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 15th October 2018 12:11:18 pm
 * @Email:  developer@xyfindables.com
 * @Filename: get-block-by-signed-hash-resolver.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 14th November 2018 12:23:50 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoBaseDataResolver } from "../xyo-base-data-resolver";
import { XyoDataResolver } from "../@types";
import { GraphQLResolveInfo } from "graphql";
import { XyoArchivistRepository } from "@xyo-network/sdk-archivist-nodejs";
import { IXyoHashProvider } from '@xyo-network/sdk-core-nodejs';
import { transformBoundWitnessToXyoBlock } from "../graphql-transformers";

export class GetBlockByHash extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

  constructor (
    private readonly archivistRepository: XyoArchivistRepository,
    protected readonly hashProvider: IXyoHashProvider
  ) {
    super(hashProvider);
  }

  public async resolve(obj: any, args: any, context: any, info: GraphQLResolveInfo): Promise<any> {
    const hexHash = args.hash as string;
    const bufferHash = Buffer.from(hexHash, 'hex');
    const block = await this.archivistRepository.getOriginBlockByHash(bufferHash);
    if (!block) {
      return undefined;
    }

    return transformBoundWitnessToXyoBlock(block, this.hashProvider);
  }
}
