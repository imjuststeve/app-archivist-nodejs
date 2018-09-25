import { XyoPacker, XyoHashProvider, XyoBase, XyoObject } from "xyo-sdk-core";

export abstract class XyoBaseDataResolver extends XyoBase {
  constructor (protected readonly xyoPacker: XyoPacker, protected readonly hashProvider: XyoHashProvider) {
    super();
  }

  protected async getHashBytesMajorMinor(xyoObject: XyoObject) {
    const bytes = this.xyoPacker.serialize(xyoObject, xyoObject.major, xyoObject.minor, true);
    const hash = await this.hashProvider.createHash(bytes);

    return {
      hash: this.xyoPacker.serialize(hash, hash.major, hash.minor, true).toString('hex'),
      bytes: bytes.toString('hex'),
      major: xyoObject.major,
      minor: xyoObject.minor
    };
  }
}
