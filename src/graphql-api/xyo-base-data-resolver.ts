import { XyoPacker, XyoHashProvider, XyoBase, XyoObject } from "@xyo-network/sdk-core-nodejs";

export abstract class XyoBaseDataResolver extends XyoBase {
  constructor (protected readonly xyoPacker: XyoPacker, protected readonly hashProvider: XyoHashProvider) {
    super();
  }

  protected async getHashBytesMajorMinor(xyoObject: XyoObject) {
    const bytes = this.xyoPacker.serialize(xyoObject, true);
    const hash = await this.hashProvider.createHash(bytes);

    return {
      hash: this.xyoPacker.serialize(hash, true).toString('hex'),
      bytes: bytes.toString('hex'),
      major: xyoObject.major,
      minor: xyoObject.minor
    };
  }
}
