/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Wednesday, 12th December 2018 4:46:05 pm
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-get-entities-resolver.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 12th December 2018 5:20:02 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { IXyoDataResolver } from "../@types"
import { IXyoArchivistRepository } from "@xyo-network/archivist-repository"
import { IXyoHashProvider } from "@xyo-network/hashing"
import { GraphQLResolveInfo } from "graphql"

export class GetEntitiesResolver implements IXyoDataResolver<any, any, any, any> {

  constructor (
    private readonly archivistRepository: IXyoArchivistRepository,
    protected readonly hashProvider: IXyoHashProvider
  ) {}

  public async resolve(obj: any, args: any, context: any, info: GraphQLResolveInfo): Promise<any> {
    const result = await this.archivistRepository.getEntities(
      args.limit as number,
      args.cursor || undefined
    )

    return {
      meta: {
        totalCount: result.totalSize,
        hasNextPage: result.hasNextPage,
        endCursor: result.cursor ? result.cursor : undefined
      },
      items: result.list.map((listItem) => {
        return {
          firstKnownPublicKey: listItem.firstKnownPublicKey.getRawPublicKey().toString('hex'),
          allPublicKeys: (listItem.allPublicKeys || []).map(pk => pk.getRawPublicKey().toString('hex')),
          type: listItem.type,
          mostRecentIndex: listItem.mostRecentIndex
        }
      })
    }
  }
}
