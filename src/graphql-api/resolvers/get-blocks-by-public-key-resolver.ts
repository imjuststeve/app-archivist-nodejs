import { XyoPacker, XyoHashProvider, XyoBoundWitness } from "@xyo-network/sdk-core-nodejs";
import { XyoArchivistRepository } from "../../xyo-archivist-repository";
import { XyoDataResolver } from "..";
import { XyoBaseDataResolver } from "../xyo-base-data-resolver";

export class GetBlocksByPublicKeyResolver extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

  constructor(
    private readonly archivistRepository: XyoArchivistRepository,
    protected readonly xyoPacker: XyoPacker,
    protected readonly hashProvider: XyoHashProvider
  ) {
    super(xyoPacker, hashProvider);
  }

  public async resolve (obj: any, args: any, context: any, info: any): Promise<any> {
    const blocks = await this.archivistRepository.getOriginBlocksWithPublicKey(
      this.xyoPacker.deserialize(Buffer.from(args.publicKeys[0], 'hex'))
    );

    context.blocks = blocks;

    const blocksCollection = await Promise.all(blocks.map(async (block) => {
      const { hash, bytes, major, minor } = await this.getHashBytesMajorMinor(block);

      return {
        hash,
        bytes,
        major,
        minor,
        payloads: await this.getPayloads(block),
        publicKeys: await this.getPublicKeys(block),
        signatures: await this.getSignatures(block)
      };
    }));

    return  [{
      publicKey: args.publicKeys[0],
      blocks: blocksCollection
    }];
  }

  private async getPayloads(block: XyoBoundWitness) {
    return Promise.all(block.payloads.map(async (payload) => {
      const { hash, bytes, major, minor } = await this.getHashBytesMajorMinor(payload);
      return {
        hash,
        bytes,
        major,
        minor,
        signedPayload: await Promise.all(payload.signedPayload.array.map(async (signedPayloadItem) => {
          return this.getHashBytesMajorMinor(signedPayloadItem);
        })),
        unsignedPayload: await Promise.all(payload.unsignedPayload.array.map(async (unsignedPayloadItem) => {
          return this.getHashBytesMajorMinor(unsignedPayloadItem);
        }))
      };
    }));
  }

  private async getPublicKeys(block: XyoBoundWitness) {
    return Promise.all(block.publicKeys.map(async (publicKeySet) => {
      const { hash, bytes, major, minor } = await this.getHashBytesMajorMinor(publicKeySet);

      return {
        hash,
        bytes,
        major,
        minor,
        array: await Promise.all(publicKeySet.array.map(async (publicKey) => {
          return this.getHashBytesMajorMinor(publicKey);
        }))
      };
    }));
  }

  private async getSignatures(block: XyoBoundWitness) {
    return Promise.all(block.signatures.map(async (signatureSet) => {
      const { hash, bytes, major, minor } = await this.getHashBytesMajorMinor(signatureSet);

      return {
        hash,
        bytes,
        major,
        minor,
        array: await Promise.all(
          signatureSet.array.map(async (signature) => {
            return this.getHashBytesMajorMinor(signature);
          })
        )
      };
    }));
  }
}
