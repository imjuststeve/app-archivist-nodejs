import { XyoPacker, XyoHashProvider } from "xyo-sdk-core";
import { XyoArchivistRepository } from "../../xyo-archivist-repository";
import { XyoDataResolver } from "..";
import { XyoBaseDataResolver } from "../xyo-base-data-resolver";

export class GetBlocksResolver extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

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
      };
    }));

    return  [{
      publicKey: args.publicKeys[0],
      blocks: blocksCollection
    }];
  }
}
