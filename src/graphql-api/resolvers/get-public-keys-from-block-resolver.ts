import { XyoBoundWitness } from "xyo-sdk-core";
import { XyoDataResolver } from "..";
import { XyoBaseDataResolver } from "../xyo-base-data-resolver";

export class GetPublicKeysFromBlockResolver extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

  public async resolve (obj: any, args: any, context: any, info: any): Promise<any> {
    const blocks = context.blocks as XyoBoundWitness[];
    const block = blocks[0];

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
}
