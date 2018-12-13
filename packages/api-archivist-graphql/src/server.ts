/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 24th September 2018 9:57:10 am
 * @Email:  developer@xyfindables.com
 * @Filename: server.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 12th December 2018 5:40:23 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { ApolloServer, gql, IResolvers } from 'apollo-server'
import { XyoBase } from '@xyo-network/base'
import { IXyoDataResolver } from './@types'

export class GraphQLServer extends XyoBase {
  private readonly server: ApolloServer

  constructor(
    private readonly schema: string,
    private readonly port: number,
    private readonly graphqlResolvers: IGraphQLResolvers
  ) {
    super()

    const { typeDefs, resolvers } = this.initialize()
    this.server = new ApolloServer({ typeDefs, resolvers })
  }

  public start (): Promise<void> {
    return this.server.listen({ port: this.port }).then(({ url }) => {
      this.logInfo(`Graphql server ready at url: ${url}`)
    })
  }

  private initialize () {
    // Build Router
    const compiledRouter = Object.keys(this.graphqlResolvers as object).reduce((router, route) => {
      // @ts-ignore
      router[route] = (obj: any, args: any, context: any, info: any) => {
        // @ts-ignore
        return (this.graphqlResolvers[route] as IXyoDataResolver).resolve(obj, args, context, info)
      }
      return router
    }, {})

    const resolvers: IResolvers = {
      Query: compiledRouter
    }

    const typeDefs = gql(this.schema)
    return { typeDefs, resolvers }
  }
}

// tslint:disable-next-line:no-empty-interface
export interface IGraphQLResolvers {
  blocksByPublicKey: IXyoDataResolver<any, any, any, any>
  blockByHash: IXyoDataResolver<any, any, any, any>
  about: IXyoDataResolver<any, any, any, any>
  blockList: IXyoDataResolver<any, any, any, any>
  entities: IXyoDataResolver<any, any, any, any>
}
