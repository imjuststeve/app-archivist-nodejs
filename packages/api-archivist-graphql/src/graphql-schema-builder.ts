import { getSchema, XyoOriginGraphqlNodeV1 } from '@xyo-network/api-originchain-graphql';
import { XyoBase } from '@xyo-network/sdk-core-nodejs';

export class GraphqlSchemaBuilder extends XyoBase {

  public async buildSchema() {
    const schema = await getSchema() as XyoOriginGraphqlNodeV1;
    const compiledSchema = `
      type Query {
        blocksByPublicKey(publicKeys: [String!]): [XyoBlockCollection],
        blocks(limit: Int!, offset: Int!): [XyoBlock],
        blockList(limit: Int!, cursor: String): XyoBlockList!,
        about(aboutYou: XyoAboutYou): XyoAboutMe,
        blockByHash(hash: String!): XyoBlock,
        entities(limit: Int!, cursor: String): XyoEntitiesList!
      }

      ${schema.types['xyo-block.graphql']}
      ${schema.types['xyo-keyset.graphql']}
      ${schema.types['xyo-object-plain.graphql']}
      ${schema.types['xyo-signature-set.graphql']}
      ${schema.types['xyo-block-collection.graphql']}
      ${schema.types['xyo-blocks-by-public-key.graphql']}
      ${schema.types['xyo-object-interface.graphql']}
      ${schema.types['xyo-payload.graphql']}
      ${schema.types['xyo-about-me.graphql']}
      ${schema.types['xyo-list.graphql']}
      ${schema.types['xyo-list-meta.graphql']}
      ${schema.types['xyo-block-list.graphql']}
      ${schema.types['xyo-entity-type.graphql']}
      ${schema.types['xyo-entity.graphql']}
      ${schema.types['xyo-entities-list.graphql']}

      ${schema.inputs['xyo-about-you.graphql']}
    `;

    return compiledSchema;
  }
}
