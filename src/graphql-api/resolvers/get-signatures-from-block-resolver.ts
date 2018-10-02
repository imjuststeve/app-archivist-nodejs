import { XyoBoundWitness, XyoPacker, XyoHashProvider } from "@xyo-network/sdk-core-nodejs";
import { XyoDataResolver } from "..";
import { XyoBaseDataResolver } from "../xyo-base-data-resolver";

export class GetSignaturesFromBlockResolver extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

  public async resolve (obj: any, args: any, context: any, info: any): Promise<any> {
    const blocks = context.blocks as XyoBoundWitness[];
    const block = blocks[0];

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
