import { XyoBoundWitness } from "xyo-sdk-core";
import { XyoDataResolver } from "..";
import { XyoBaseDataResolver } from "../xyo-base-data-resolver";

export class GetPayloadsFromBlockResolver extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

  public async resolve (obj: any, args: any, context: any, info: any): Promise<any> {
    const blocks = context.blocks as XyoBoundWitness[];
    const block = blocks[0];

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
}
