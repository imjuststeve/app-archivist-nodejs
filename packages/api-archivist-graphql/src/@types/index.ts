import { GraphQLResolveInfo } from 'graphql'

export interface IXyoDataResolver <TSource, TArgs, TContext, TResult> {
  resolve(obj: TSource, args: TArgs, context: TContext, info: GraphQLResolveInfo): Promise<TResult>
}
