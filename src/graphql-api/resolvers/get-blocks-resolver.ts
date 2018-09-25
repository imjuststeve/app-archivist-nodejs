import { XyoBase, XyoPacker, XyoHashProvider } from "../../../../sdk-core-nodejs";
import { XyoArchivistRepository } from "../../xyo-archivist-repository";

export class GetBlocksResolver extends XyoBase {

  constructor(
    private readonly archivistRepository: XyoArchivistRepository,
    private readonly xyoPacker: XyoPacker,
    private readonly hashProvider: XyoHashProvider
  ) {
    super();
  }

  public async getResolver (obj: any, args: any, context: any, info: any): Promise<any> {
    this.logInfo(obj, args, context, info);

    const blocks = await this.archivistRepository.getOriginBlocksWithPublicKey(
      this.xyoPacker.deserialize(Buffer.from(args.publicKeys[0], 'hex'))
    );

    const mapped = await Promise.all(blocks.map(async (block) => {
      const bytes = this.xyoPacker.serialize(block, block.major, block.minor, true);
      const hash = await this.hashProvider.createHash(bytes);
      return {
        hash: this.xyoPacker.serialize(hash, hash.major, hash.minor, true).toString('hex'),
        bytes: bytes.toString('hex'),
        major: block.major,
        minor: block.minor,
        publicKeys: await Promise.all(block.publicKeys.map(async (publicKeySet) => {
          const keySetBytes = this.xyoPacker.serialize(publicKeySet, publicKeySet.major, publicKeySet.minor, true);
          const keySetHash = await this.hashProvider.createHash(bytes);

          return {
            hash: this.xyoPacker.serialize(keySetHash, keySetHash.major, keySetHash.minor, true).toString('hex'),
            bytes: keySetBytes.toString('hex'),
            major: publicKeySet.major,
            minor: publicKeySet.minor,
            array: await Promise.all(publicKeySet.array.map(async (publicKey) => {
              const publicKeyBytes = this.xyoPacker.serialize(publicKey, publicKey.major, publicKey.minor, true);
              const publicKeyHash = await this.hashProvider.createHash(publicKeyBytes);
              return {
                hash: this.xyoPacker.serialize(
                  publicKeyHash,
                  publicKeyHash.major,
                  publicKeyHash.minor,
                  true
                ).toString('hex'),
                bytes: publicKeyBytes.toString('hex'),
                major: publicKeyHash.major,
                minor: publicKeyHash.minor,
              };
            }))
          };
        })),
        signatures: await Promise.all(block.signatures.map(async (signatureSet) => {
          const signatureSetBytes = this.xyoPacker.serialize(
            signatureSet,
            signatureSet.major,
            signatureSet.minor,
            true
          );
          const signatureSetHash = await this.hashProvider.createHash(bytes);

          return {
            hash: this.xyoPacker.serialize(
              signatureSetHash,
              signatureSetHash.major,
              signatureSetHash.minor,
              true).toString('hex')
            ,
            bytes: signatureSetBytes.toString('hex'),
            major: signatureSet.major,
            minor: signatureSet.minor,
            array: await Promise.all(signatureSet.array.map(async (signature) => {
              const signatureBytes = this.xyoPacker.serialize(signature, signature.major, signature.minor, true);
              const signatureHash = await this.hashProvider.createHash(signatureBytes);
              return {
                hash: this.xyoPacker.serialize(
                  signatureHash,
                  signatureHash.major,
                  signatureHash.minor,
                  true
                ).toString('hex'),
                bytes: signatureBytes.toString('hex'),
                major: signatureHash.major,
                minor: signatureHash.minor,
              };
            }))
          };
        })),
        payloads: await Promise.all(block.payloads.map(async (payload) => {
          const payloadBytes = this.xyoPacker.serialize(payload, payload.major, payload.minor, true);
          const payloadHash = await this.hashProvider.createHash(payloadBytes);

          return {
            hash: this.xyoPacker.serialize(
              payloadHash,
              payloadHash.major,
              payloadHash.minor,
              true
            ).toString('hex'),
            bytes: payloadBytes.toString('hex'),
            major: payloadHash.major,
            minor: payloadHash.minor,
            signedPayload: await Promise.all(payload.signedPayload.array.map(async (signedPayloadItem) => {
              const signedPayloadBytes = this.xyoPacker.serialize(
                signedPayloadItem,
                signedPayloadItem.major,
                signedPayloadItem.minor,
                true
              );

              const signedPayloadHash = await this.hashProvider.createHash(signedPayloadBytes);
              return {
                hash: this.xyoPacker.serialize(
                  signedPayloadHash,
                  signedPayloadHash.major,
                  signedPayloadHash.minor,
                  true
                ).toString('hex'),
                bytes: signedPayloadBytes.toString('hex'),
                major: signedPayloadItem.major,
                minor: signedPayloadItem.minor
              };
            })),
            unsignedPayload: await Promise.all(payload.unsignedPayload.array.map(async (unsignedPayloadItem) => {
              const unsignedPayloadBytes = this.xyoPacker.serialize(
                unsignedPayloadItem,
                unsignedPayloadItem.major,
                unsignedPayloadItem.minor,
                true
              );

              const unsignedPayloadHash = await this.hashProvider.createHash(unsignedPayloadBytes);
              return {
                hash: this.xyoPacker.serialize(
                  unsignedPayloadHash,
                  unsignedPayloadHash.major,
                  unsignedPayloadHash.minor,
                  true
                ).toString('hex'),
                bytes: unsignedPayloadBytes.toString('hex'),
                major: unsignedPayloadItem.major,
                minor: unsignedPayloadItem.minor
              };
            }))
          };
        }))
      };
    }));

    return  [{
      publicKey: args.publicKeys[0],
      blocks: mapped
    }];
  }
}
