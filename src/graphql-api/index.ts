import { GraphQLResolveInfo } from 'graphql';

export interface XyoDataResolver <TSource, TArgs, TContext, TResult> {
  resolve(obj: TSource, args: TArgs, context: TContext, info: GraphQLResolveInfo): Promise<TResult>;
}
