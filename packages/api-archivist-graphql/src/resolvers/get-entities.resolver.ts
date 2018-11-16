/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Tuesday, 23rd October 2018 4:49:41 pm
 * @Email:  developer@xyfindables.com
 * @Filename: get-entities.resolver.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 14th November 2018 4:27:04 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoBaseDataResolver } from "../xyo-base-data-resolver";
import { XyoDataResolver } from "../@types";
import { GraphQLResolveInfo } from "graphql";
import { XyoArchivistRepository } from "@xyo-network/sdk-archivist-nodejs";
import { IXyoHashProvider } from '@xyo-network/sdk-core-nodejs';

export class GetEntitiesResolver extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

  constructor (
    private readonly archivistRepository: XyoArchivistRepository,
    protected readonly hashProvider: IXyoHashProvider
  ) {
    super(hashProvider);
  }

  public async resolve(obj: any, args: any, context: any, info: GraphQLResolveInfo): Promise<any> {
    const result = await this.archivistRepository.getEntities(
      args.limit as number,
      args.cursor || undefined
    );

    return {
      meta: {
        totalCount: result.totalSize,
        hasNextPage: result.hasNextPage,
        endCursor: result.cursor ? result.cursor : undefined
      },
      items: result.list
    };
  }
}
