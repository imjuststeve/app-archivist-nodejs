/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 24th September 2018 9:57:10 am
 * @Email:  developer@xyfindables.com
 * @Filename: server.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Monday, 24th September 2018 11:32:21 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { ApolloServer, gql, IResolvers } from 'apollo-server';
import { XyoBase } from 'xyo-sdk-core';
import { XyoDataResolver } from '.';

export class GraphQLServer extends XyoBase {
  private readonly server: ApolloServer;

  constructor(
    private readonly schema: string,
    private readonly getBlocksResolver: XyoDataResolver<any, any, any, any>,
    private readonly getPayloadsFromBlockResolver: XyoDataResolver<any, any, any, any>,
    private readonly getPublicKeysFromBlockResolver: XyoDataResolver<any, any, any, any>
  ) {
    super();

    const { typeDefs, resolvers } = this.initialize();
    this.server = new ApolloServer({ typeDefs, resolvers });
  }

  public start (): Promise<void> {
    return this.server.listen().then(({ url }) => {
      this.logInfo(`Graphql server ready at ${url}`);
    });
  }

  private initialize () {
    const resolvers: IResolvers = {
      Query: {
        blocks: (obj: any, args: any, context: any, info: any) => {
          return this.getBlocksResolver.resolve(obj, args, context, info);
        }
      },
      XyoBlock: {
        payloads: (obj: any, args: any, context: any, info: any) => {
          return this.getPayloadsFromBlockResolver.resolve(obj, args, context, info);
        },
        publicKeys: (obj: any, args: any, context: any, info: any) => {
          this.getPublicKeysFromBlockResolver.resolve(obj, args, context, info);
        }
      }
    };

    const typeDefs = gql(this.schema);
    return { typeDefs, resolvers };
  }
}
