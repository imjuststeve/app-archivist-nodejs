/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 24th September 2018 9:57:10 am
 * @Email:  developer@xyfindables.com
 * @Filename: server.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 3rd October 2018 2:26:52 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { ApolloServer, gql, IResolvers } from 'apollo-server';
import { XyoBase } from '@xyo-network/sdk-core-nodejs';
import { XyoDataResolver } from '.';

export class GraphQLServer extends XyoBase {
  private readonly server: ApolloServer;

  constructor(
    private readonly schema: string,
    private readonly getBlocksByPublicKeyResolver: XyoDataResolver<any, any, any, any>,
    private readonly getPayloadsFromBlockResolver: XyoDataResolver<any, any, any, any>,
    private readonly getPublicKeysFromBlockResolver: XyoDataResolver<any, any, any, any>,
    private readonly getAllBlocks: XyoDataResolver<any, any, any, any>,
    private readonly port: number
  ) {
    super();

    const { typeDefs, resolvers } = this.initialize();
    this.server = new ApolloServer({ typeDefs, resolvers });
  }

  public start (): Promise<void> {
    return this.server.listen({ port: this.port }).then(({ url }) => {
      this.logInfo(`Graphql server ready at ${url}`);
    });
  }

  private initialize () {
    const resolvers: IResolvers = {
      Query: {
        blocksByPublicKey: (obj: any, args: any, context: any, info: any) => {
          return this.getBlocksByPublicKeyResolver.resolve(obj, args, context, info);
        },
        blocks: (obj: any, args: any, context: any, info: any) => {
          return this.getAllBlocks.resolve(obj, args, context, info);
        },
      }
    };

    const typeDefs = gql(this.schema);
    return { typeDefs, resolvers };
  }
}
