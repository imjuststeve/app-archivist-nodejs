/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Thursday, 18th October 2018 2:13:12 pm
 * @Email:  developer@xyfindables.com
 * @Filename: get-block-list-resolver.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 14th November 2018 12:23:50 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoBaseDataResolver } from "../xyo-base-data-resolver";
import { XyoDataResolver } from "../@types";
import { GraphQLResolveInfo } from "graphql";
import { XyoArchivistRepository } from "@xyo-network/sdk-archivist-nodejs";
import { IXyoHashProvider, XyoHash } from '@xyo-network/sdk-core-nodejs';
import { transformBoundWitnessToXyoBlock } from "../graphql-transformers";

export class GetBlockList extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

  constructor (
    private readonly archivistRepository: XyoArchivistRepository,
    protected readonly hashProvider: IXyoHashProvider
  ) {
    super(hashProvider);
  }

  public async resolve(obj: any, args: any, context: any, info: GraphQLResolveInfo): Promise<any> {
    const cursor = args.cursor as string | undefined;
    const cursorBuffer = cursor ? Buffer.from(cursor, 'hex') : undefined;
    const result = await this.archivistRepository.getOriginBlocks(args.limit as number, cursorBuffer);

    let endCursor: string | undefined;
    if (result.list.length) {
      endCursor = (await result.list[result.list.length - 1].getHash(this.hashProvider))
        .serialize(true)
        .toString('hex');
    }

    return {
      meta: {
        totalCount: result.totalSize,
        hasNextPage: result.hasNextPage,
        endCursor
      },
      items: await Promise.all(result.list.map((bw) => {
        return transformBoundWitnessToXyoBlock(bw, this.hashProvider);
      }))
    };
  }

}
