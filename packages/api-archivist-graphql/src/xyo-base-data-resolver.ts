import { IXyoHashProvider, XyoBase, IXyoObject } from '@xyo-network/sdk-core-nodejs';

export abstract class XyoBaseDataResolver extends XyoBase {
  constructor (protected readonly hashProvider: IXyoHashProvider) {
    super();
  }

  protected async getHashBytesMajorMinor(xyoObject: IXyoObject) {
    const bytes = xyoObject.serialize(true);
    const hash = await this.hashProvider.createHash(bytes);

    return {
      hash: hash.serialize(true).toString('hex'),
      bytes: bytes.toString('hex'),
      major: xyoObject.major,
      minor: xyoObject.minor
    };
  }
}
