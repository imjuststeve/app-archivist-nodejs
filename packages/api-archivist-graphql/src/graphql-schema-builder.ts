import { XyoBase } from '@xyo-network/base'

export class GraphqlSchemaBuilder extends XyoBase {

  public async buildSchema() {
    const compiledSchema = `
          type Query {
            blocksByPublicKey(publicKeys: [String!]): [XyoBlockCollection],
            blockList(limit: Int!, cursor: String): XyoBlockList!,
            about(aboutYou: XyoAboutYou): XyoAboutMe,
            blockByHash(hash: String!): XyoBlock,
            entities(limit: Int!, cursor: String): XyoEntitiesList!
          }

          type XyoBlock {
            publicKeys: [XyoKeySet!]
            signatures: [XyoSignatureSet!]
            heuristics: [XyoHeuristicSet!]
            signedHash: String!
          }

          type XyoKeySet {
            array: [XyoPublicKey!]
          }

          type XyoObject {
            schemaName: String!
            bytes: String!
            value: String!
          }

          type XyoSignatureSet {
            array: [XyoSignature!]
          }

          type XyoSignature {
            schemaName: String!
            bytes: String!
            rawSignature: String!
          }

          type XyoPublicKey {
            schemaName: String!
            bytes: String!
            rawPublicKey: String!
          }

          type XyoHeuristicSet {
            array: [XyoObject!]
          }

          type XyoBlockCollection {
            publicKey: String!
            blocks: [XyoBlock!]!
            publicKeySet: [String!]!
          }

          type BlocksByPublicKey {
            blocks(publicKeys: [String!]): [XyoBlockCollection!]
          }

          type XyoAboutMe {
            name: String,
            version: String,
            ip: String,
            graphqlPort: Int,
            nodePort: Int,
            address: String,
            peers: [XyoAboutMe]
          }

          interface List {
            meta: ListMeta!
          }

          type ListMeta {
            totalCount: Int!,
            endCursor: String,
            hasNextPage: Boolean!
          }

          type XyoBlockList implements List {
            meta: ListMeta!
            items: [XyoBlock!]!
          }

          type XyoEntityType {
            sentinel: Boolean!,
            bridge: Boolean!,
            archivist: Boolean!,
            diviner: Boolean!
          }

          type XyoEntity {
            firstKnownPublicKey: String!
            allPublicKeys: [String!]!
            type: XyoEntityType!
            mostRecentIndex: Int!
          }

          type XyoEntitiesList implements List {
            meta: ListMeta!
            items: [XyoEntity!]!
          }

          input XyoAboutYou {
            name: String,
            version: String,
            ip: String,
            graphqlPort: Int,
            nodePort: Int,
            address: String,
            peers: [XyoAboutYou]
          }
    `

    return compiledSchema
  }
}
