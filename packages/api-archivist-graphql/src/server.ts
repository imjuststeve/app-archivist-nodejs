/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 24th September 2018 9:57:10 am
 * @Email:  developer@xyfindables.com
 * @Filename: server.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Friday, 16th November 2018 9:50:47 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { ApolloServer, gql, IResolvers, IResolverObject } from 'apollo-server';
import { XyoBase } from '@xyo-network/sdk-core-nodejs';
import { XyoDataResolver } from './@types';

export class GraphQLServer extends XyoBase {
  private readonly server: ApolloServer;

  constructor(
    private readonly schema: string,
    private readonly port: number,
    private readonly graphqlResolvers: IGraphQLResolvers
  ) {
    super();

    const { typeDefs, resolvers } = this.initialize();
    this.server = new ApolloServer({ typeDefs, resolvers });
  }

  public start (): Promise<void> {
    return this.server.listen({ port: this.port }).then(({ url }) => {
      this.logInfo(`Graphql server ready at url: ${url}`);
    });
  }

  private initialize () {
    // Build Router
    const compiledRouter = Object.keys(this.graphqlResolvers as object).reduce((router, route) => {
      // @ts-ignore
      router[route] = (obj: any, args: any, context: any, info: any) => {
        // @ts-ignore
        return (this.graphqlResolvers[route] as XyoDataResolver).resolve(obj, args, context, info);
      };
      return router;
    }, {});

    const resolvers: IResolvers = {
      Query: compiledRouter
    };

    const typeDefs = gql(this.schema);
    return { typeDefs, resolvers };
  }
}

export interface IGraphQLResolvers {
  blocksByPublicKey: XyoDataResolver<any, any, any, any>;
  blocks: XyoDataResolver<any, any, any, any>;
  blockByHash: XyoDataResolver<any, any, any, any>;
  about: XyoDataResolver<any, any, any, any>;
  blockList: XyoDataResolver<any, any, any, any>;
  entities: XyoDataResolver<any, any, any, any>;
}
