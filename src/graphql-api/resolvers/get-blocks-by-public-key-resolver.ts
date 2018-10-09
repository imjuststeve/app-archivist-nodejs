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
    const blocks = await Promise.all((args.publicKeys as string[]).map(async (publicKey) => {
      const innerBlocks = await this.getBlockCollectionForPublicKey(publicKey);
      return {
        publicKey,
        publicKeySet: innerBlocks.keySet,
        blocks: innerBlocks.blocks
      };
    }));

    return blocks;
  }

  private async getBlockCollectionForPublicKey(publicKey: string) {
    const blocksByPublicKeySet = await this.archivistRepository.getOriginBlocksByPublicKey(
      this.xyoPacker.deserialize(Buffer.from(publicKey, 'hex'))
    );

    const serializedBoundWitnesses = await Promise.all(blocksByPublicKeySet.boundWitnesses.map(async (block) => {
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
    return {
      blocks: serializedBoundWitnesses,
      keySet: blocksByPublicKeySet.publicKeys.map((publicKeyItem) => {
        return this.xyoPacker.serialize(publicKeyItem, true).toString('hex');
      })
    };
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
        array: await Promise.all(publicKeySet.array.map((publicKey) => {
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
