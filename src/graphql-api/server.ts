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
import { XyoBase, XyoPacker, XyoHashProvider } from '../../../sdk-core-nodejs';
import { XyoArchivistRepository } from '../xyo-archivist-repository';

const typeDefs = gql`
  type XyoBlock {
    hash: String!
    bytes: String!
    major: Int!
    minor: Int!

    publicKeys: [XyoKeySet!]
    signatures: [XyoSignatureSet!]
    payloads: [XyoPayload!]
  }

  type XyoPayload {
    hash: String!
    bytes: String!
    major: Int!
    minor: Int!

    signedPayload: [XyoObject!],
    unsignedPayload: [XyoObject!],
  }

  type XyoKeySet {
    hash: String!
    bytes: String!
    major: Int!
    minor: Int!

    array: [XyoObject!]
  }

  type XyoSignatureSet {
    hash: String!
    bytes: String!
    major: Int!
    minor: Int!

    array: [XyoObject!]
  }

  type XyoObject {
    hash: String!
    bytes: String!
    major: Int!
    minor: Int!
  }

  type XyoBlockCollection {
    publicKey: String!
    blocks: [XyoBlock]
  }

  type Query {
    blocks(publicKeys: [String!]): [XyoBlockCollection]
  }
`;

export class GraphQLServer extends XyoBase {
  private readonly server: ApolloServer;

  constructor(
    archivistRepository: XyoArchivistRepository,
    xyoPacker: XyoPacker,
    hashProvider: XyoHashProvider
  ) {
    super();
    const resolvers: IResolvers = {
      Query: {
        blocks: async (obj, args, context, info) => {
          this.logInfo(obj, args, context, info);
          const blocks = await archivistRepository.getOriginBlocksWithPublicKey(
            xyoPacker.deserialize(Buffer.from(args.publicKeys[0], 'hex'))
          );

          const mapped = await Promise.all(blocks.map(async (block) => {
            const bytes = xyoPacker.serialize(block, block.major, block.minor, true);
            const hash = await hashProvider.createHash(bytes);
            return {
              hash: xyoPacker.serialize(hash, hash.major, hash.minor, true).toString('hex'),
              bytes: bytes.toString('hex'),
              major: block.major,
              minor: block.minor,
              publicKeys: await Promise.all(block.publicKeys.map(async (publicKeySet) => {
                const keySetBytes = xyoPacker.serialize(publicKeySet, publicKeySet.major, publicKeySet.minor, true);
                const keySetHash = await hashProvider.createHash(bytes);

                return {
                  hash: xyoPacker.serialize(keySetHash, keySetHash.major, keySetHash.minor, true).toString('hex'),
                  bytes: keySetBytes.toString('hex'),
                  major: publicKeySet.major,
                  minor: publicKeySet.minor,
                  array: await Promise.all(publicKeySet.array.map(async (publicKey) => {
                    const publicKeyBytes = xyoPacker.serialize(publicKey, publicKey.major, publicKey.minor, true);
                    const publicKeyHash = await hashProvider.createHash(publicKeyBytes);
                    return {
                      hash: xyoPacker.serialize(
                        publicKeyHash,
                        publicKeyHash.major,
                        publicKeyHash.minor,
                        true
                      ).toString('hex'),
                      bytes: publicKeyBytes.toString('hex'),
                      major: publicKeyHash.major,
                      minor: publicKeyHash.minor,
                    };
                  }))
                };
              })),
              signatures: await Promise.all(block.signatures.map(async (signatureSet) => {
                const signatureSetBytes = xyoPacker.serialize(
                  signatureSet,
                  signatureSet.major,
                  signatureSet.minor,
                  true
                );
                const signatureSetHash = await hashProvider.createHash(bytes);

                return {
                  hash: xyoPacker.serialize(
                    signatureSetHash,
                    signatureSetHash.major,
                    signatureSetHash.minor,
                    true).toString('hex')
                  ,
                  bytes: signatureSetBytes.toString('hex'),
                  major: signatureSet.major,
                  minor: signatureSet.minor,
                  array: await Promise.all(signatureSet.array.map(async (signature) => {
                    const signatureBytes = xyoPacker.serialize(signature, signature.major, signature.minor, true);
                    const signatureHash = await hashProvider.createHash(signatureBytes);
                    return {
                      hash: xyoPacker.serialize(
                        signatureHash,
                        signatureHash.major,
                        signatureHash.minor,
                        true
                      ).toString('hex'),
                      bytes: signatureBytes.toString('hex'),
                      major: signatureHash.major,
                      minor: signatureHash.minor,
                    };
                  }))
                };
              })),
              payloads: await Promise.all(block.payloads.map(async (payload) => {
                const payloadBytes = xyoPacker.serialize(payload, payload.major, payload.minor, true);
                const payloadHash = await hashProvider.createHash(payloadBytes);

                return {
                  hash: xyoPacker.serialize(
                    payloadHash,
                    payloadHash.major,
                    payloadHash.minor,
                    true
                  ).toString('hex'),
                  bytes: payloadBytes.toString('hex'),
                  major: payloadHash.major,
                  minor: payloadHash.minor,
                  signedPayload: await Promise.all(payload.signedPayload.array.map(async (signedPayloadItem) => {
                    const signedPayloadBytes = xyoPacker.serialize(
                      signedPayloadItem,
                      signedPayloadItem.major,
                      signedPayloadItem.minor,
                      true
                    );

                    const signedPayloadHash = await hashProvider.createHash(signedPayloadBytes);
                    return {
                      hash: xyoPacker.serialize(
                        signedPayloadHash,
                        signedPayloadHash.major,
                        signedPayloadHash.minor,
                        true
                      ).toString('hex'),
                      bytes: signedPayloadBytes.toString('hex'),
                      major: signedPayloadItem.major,
                      minor: signedPayloadItem.minor
                    };
                  })),
                  unsignedPayload: await Promise.all(payload.unsignedPayload.array.map(async (unsignedPayloadItem) => {
                    const unsignedPayloadBytes = xyoPacker.serialize(
                      unsignedPayloadItem,
                      unsignedPayloadItem.major,
                      unsignedPayloadItem.minor,
                      true
                    );

                    const unsignedPayloadHash = await hashProvider.createHash(unsignedPayloadBytes);
                    return {
                      hash: xyoPacker.serialize(
                        unsignedPayloadHash,
                        unsignedPayloadHash.major,
                        unsignedPayloadHash.minor,
                        true
                      ).toString('hex'),
                      bytes: unsignedPayloadBytes.toString('hex'),
                      major: unsignedPayloadItem.major,
                      minor: unsignedPayloadItem.minor
                    };
                  }))
                };
              }))
            };
          }));

          return  [{
            publicKey: args.publicKeys[0],
            blocks: mapped
          }];
        }
      }
    };

    this.server = new ApolloServer({ typeDefs, resolvers });
  }

  public start (): Promise<void> {
    return this.server.listen().then(({ url }) => {
      this.logInfo(`Graphql server ready at ${url}`);
    });
  }
}
