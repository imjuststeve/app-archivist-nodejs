/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 15th October 2018 4:43:21 pm
 * @Email:  developer@xyfindables.com
 * @Filename: index.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 15th November 2018 11:44:45 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { GraphQLServer } from "./server";
import { GraphqlSchemaBuilder } from "./graphql-schema-builder";
import { XyoArchivistRepository, XyoAboutMeService } from "@xyo-network/sdk-archivist-nodejs";
import { GetBlocksByPublicKeyResolver } from "./resolvers/get-blocks-by-public-key-resolver";
import { GetAboutMeResolver } from "./resolvers/get-about-me-resolver";
import { GetAllBlocks } from "./resolvers/get-all-blocks-resolver";
import { IXyoHashProvider } from '@xyo-network/sdk-core-nodejs';
import { GetBlockByHash } from "./resolvers/get-block-by-hash-resolver";
import { GetBlockList } from "./resolvers/get-block-list-resolver";
import { GetEntitiesResolver } from "./resolvers/get-entities.resolver";

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
  archivistRepository: XyoArchivistRepository,
  hashProvider: IXyoHashProvider
) {
  const server = new GraphQLServer(
    await new GraphqlSchemaBuilder().buildSchema(),
    port,
    {
      blocksByPublicKey: new GetBlocksByPublicKeyResolver(archivistRepository, hashProvider),
      about: new GetAboutMeResolver(aboutMeService, hashProvider),
      blocks: new GetAllBlocks(archivistRepository, hashProvider),
      blockByHash: new GetBlockByHash(archivistRepository, hashProvider),
      blockList: new GetBlockList(archivistRepository, hashProvider),
      entities: new GetEntitiesResolver(archivistRepository, hashProvider)
    }
  );

  server.start();
}
