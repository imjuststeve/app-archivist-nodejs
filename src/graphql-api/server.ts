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
import { XyoBase } from '../../../sdk-core-nodejs';

export class GraphQLServer extends XyoBase {
  private readonly server: ApolloServer;

  constructor(schema: string, getBlocksResolver: any) {
    super();
    const resolvers: IResolvers = {
      Query: {
        blocks: getBlocksResolver.getResolver.bind(getBlocksResolver)
      }
    };
    const typeDefs = gql(schema);
    this.server = new ApolloServer({ typeDefs, resolvers });
  }

  public start (): Promise<void> {
    return this.server.listen().then(({ url }) => {
      this.logInfo(`Graphql server ready at ${url}`);
    });
  }
}
