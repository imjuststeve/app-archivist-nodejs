/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 15th October 2018 4:43:21 pm
 * @Email:  developer@xyfindables.com
 * @Filename: index.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 12th December 2018 5:41:38 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { GraphQLServer } from "./server"
import { GraphqlSchemaBuilder } from "./graphql-schema-builder"
import { IXyoArchivistRepository } from "@xyo-network/archivist-repository"
import { IXyoHashProvider } from '@xyo-network/hashing'
import { XyoAboutMeService } from '@xyo-network/about-me'
import { XyoAboutMeResolver } from "./resolvers/xyo-about-me-resolver"
import { XyoGetBlockByHashResolver } from "./resolvers/xyo-get-block-by-hash-resolver"
import { GetEntitiesResolver } from "./resolvers/xyo-get-entities-resolver"
import { XyoGetBlockList } from "./resolvers/xyo-get-block-list-resolver"
import { XyoGetBlocksByPublicKeyResolver } from "./resolvers/xyo-get-blocks-by-public-key-resolver"
import { IXyoSerializationService } from "@xyo-network/serialization"

/**
 * Initializes and starts a GraphQL service
 *
 * @export
 * @param {number} port The port the service will be available on
 * @param {XyoAboutMeService} aboutMeService Provides information about the Node using this service
 * @param {XyoArchivistRepository} archivistRepository An implementation of an `XyoArchivistRepository`
 * @param {IXyoHashProvider} hashProvider Provides hashing services
 */

export default async function initialize(
  port: number,
  aboutMeService: XyoAboutMeService,
  archivistRepository: IXyoArchivistRepository,
  hashProvider: IXyoHashProvider,
  serializationService: IXyoSerializationService
) {
  const server = new GraphQLServer(
    await new GraphqlSchemaBuilder().buildSchema(),
    port,
    {
      about: new XyoAboutMeResolver(aboutMeService),
      blockByHash: new XyoGetBlockByHashResolver(archivistRepository, hashProvider),
      entities: new GetEntitiesResolver(archivistRepository, hashProvider),
      blockList: new XyoGetBlockList(archivistRepository, hashProvider),
      blocksByPublicKey: new XyoGetBlocksByPublicKeyResolver(
        archivistRepository,
        hashProvider,
        serializationService
      )
    }
  )

  server.start()
}
