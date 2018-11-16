import { IXyoHashProvider, XyoBoundWitness, IXyoObject, deserialize } from '@xyo-network/sdk-core-nodejs';
import { XyoArchivistRepository } from "@xyo-network/sdk-archivist-nodejs";
import { XyoDataResolver } from "../@types";
import { XyoBaseDataResolver } from "../xyo-base-data-resolver";
import { transformBoundWitnessToXyoBlock } from "../graphql-transformers";

export class GetBlocksByPublicKeyResolver extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

  constructor(
    private readonly archivistRepository: XyoArchivistRepository,
    protected readonly hashProvider: IXyoHashProvider
  ) {
    super(hashProvider);
  }

  public async resolve (obj: any, args: any, context: any, info: any): Promise<any> {
    if (!args || !args.publicKeys || !args.publicKeys.length) {
      return [];
    }

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
    try {
      const blocksByPublicKeySet = await this.archivistRepository.getOriginBlocksByPublicKey(
        deserialize(Buffer.from(publicKey, 'hex'))
      );

      const serializedBoundWitnesses = await Promise.all(blocksByPublicKeySet.boundWitnesses.map(async (block) => {
        return transformBoundWitnessToXyoBlock(block, this.hashProvider);
      }));

      return {
        blocks: serializedBoundWitnesses,
        keySet: blocksByPublicKeySet.publicKeys.map((publicKeyItem) => {
          return publicKeyItem.serialize(true).toString('hex');
        })
      };

    } catch (e) {
      this.logError(`There was an error getting block-collection from public-key`, e);
      return {
        blocks: [],
        keySet: [publicKey]
      };
    }
  }
}
