import { importSchema } from 'graphql-import';
import path from 'path';
import { getSchema, XyoOriginGraphqlNodeV1 } from 'xyo-api-originchain-graphql';
import { XyoBase } from 'xyo-sdk-core';

export class GraphqlSchemaBuilder extends XyoBase {

  public async buildSchema() {
    const schema = await getSchema() as XyoOriginGraphqlNodeV1;
    return `
      type Query {
        blocksByPublicKey(publicKeys: [String!]): [XyoBlockCollection]
      }

      ${schema.types['xyo-block-collection.graphql']}
      ${schema.types['xyo-block.graphql']}
      ${schema.types['xyo-object-interface.graphql']}
      ${schema.types['xyo-payload.graphql']}
      ${schema.types['xyo-keyset.graphql']}
      ${schema.types['xyo-object-plain.graphql']}
      ${schema.types['xyo-signature-set.graphql']}
    `;
  }
}
