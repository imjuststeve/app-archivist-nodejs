/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Tuesday, 18th September 2018 2:19:36 pm
 * @Email:  developer@xyfindables.com
 * @Filename: simulation-client.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Monday, 24th September 2018 11:32:22 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

// tslint:disable:ter-prefer-arrow-callback

import net from 'net';

import {
  XyoZigZagBoundWitness,
  XyoDefaultPackerProvider,
  XyoSigner,
  XyoRSASha256SignerProvider,
  XyoPayload,
  XyoMultiTypeArrayInt,
  XyoRssi,
  XYO_TCP_SIZE_OF_TCP_PAYLOAD_BYTES,
  XYO_TCP_CATALOGUE_SIZE_OF_SIZE_BYTES,
  XYO_TCP_CATALOGUE_LENGTH_IN_BYTES,
  XyoBoundWitnessTransfer,
  XyoBoundWitness,
  XyoPacker,
  XyoSingleTypeArrayInt,
  XyoSha256HashProvider
} from '../../../sdk-core-nodejs/dist/lib';

const logger = console;

if (require.main === module) {
  main();
}

async function main() {
  const packerProvider = new XyoDefaultPackerProvider();
  const packer = packerProvider.getXyoPacker();
  const signerProvider = new XyoRSASha256SignerProvider();
  const signers: XyoSigner[] = [signerProvider.newInstance()];
  const hashProvider = new XyoSha256HashProvider();

  const {
    major: boundWitnessTransferMajor,
    minor: boundWitnessTransferMinor
  } = packer.getMajorMinor(XyoBoundWitnessTransfer.name);

  const {
    major: boundWitnessMajor,
    minor: boundWitnessMinor
  } = packer.getMajorMinor(XyoBoundWitness.name);

  const {
    major: singleTypeArrayIntMajor,
    minor: singleTypeArrayIntMinor
  } = packer.getMajorMinor(XyoSingleTypeArrayInt.name);

  const initialPayload = new XyoPayload(
    new XyoMultiTypeArrayInt([new XyoRssi(10)]),
    new XyoMultiTypeArrayInt([new XyoRssi(10)])
  );

  const boundWitness = await doBoundWitnessWithServer(
    8087,
    initialPayload,
    packer,
    signers,
    boundWitnessTransferMajor,
    boundWitnessTransferMinor
  );

  const boundWitnessBlocks = new XyoSingleTypeArrayInt(
    boundWitnessMajor,
    boundWitnessMinor,
    [boundWitness]
  );

  const untypedSerialized = packer.serialize(
    boundWitnessBlocks,
    singleTypeArrayIntMajor,
    singleTypeArrayIntMinor,
    false
  );

  const hash = await hashProvider.createHash(untypedSerialized);

  const payload = new XyoPayload(
    new XyoMultiTypeArrayInt([hash]),
    new XyoMultiTypeArrayInt([boundWitnessBlocks])
  );

  setTimeout(async () => {
    await doBoundWitnessWithServer(8088,
      payload,
      packer,
      signers,
      boundWitnessTransferMajor,
      boundWitnessTransferMinor);
  }, 3000);
}

async function doBoundWitnessWithServer(
  port: number,
  payload: XyoPayload,
  packer: XyoPacker,
  signers: XyoSigner[],
  boundWitnessTransferMajor: number,
  boundWitnessTransferMinor: number
): Promise<XyoBoundWitness> {
  return new Promise((resolve, reject) => {
    const boundWitnessTransferSerializer = packer.getSerializerByName(XyoBoundWitnessTransfer.name);

    let step = 0;

    const client = net.createConnection({ port }, () => {
      logger.log('connected to server!');
      client.write(Buffer.from([
        0x00, 0x00, 0x00, 0x09,
        0x04,
        0x00, 0x00, 0x00, 0x01
      ]));

      step = 1;
    });

    let data: Buffer | undefined;
    let sizeOfPayload: number | undefined;

    const boundWitness: XyoZigZagBoundWitness = new XyoZigZagBoundWitness(packer, signers, payload);

    client.on('data', async function listener(chunk) {
      logger.log(`Data received, Step: ${step}, chunkLength: ${chunk.length}`);

      data = Buffer.concat([
        data || new Buffer(0),
        chunk
      ]);

      if (data.length < XYO_TCP_SIZE_OF_TCP_PAYLOAD_BYTES) {
        return;
      }

      if (sizeOfPayload === undefined) {
        sizeOfPayload = data.readUInt32BE(0);
      }

      if (step === 1 && data.length < XYO_TCP_SIZE_OF_TCP_PAYLOAD_BYTES + XYO_TCP_CATALOGUE_SIZE_OF_SIZE_BYTES) {
        return;
      }

      if (sizeOfPayload === data.length) {
        const boundWitnessTransfer = data.slice(
          XYO_TCP_CATALOGUE_LENGTH_IN_BYTES + (
            (step === 1) ? XYO_TCP_CATALOGUE_SIZE_OF_SIZE_BYTES + XYO_TCP_SIZE_OF_TCP_PAYLOAD_BYTES : 0)
        );

        if (step === 1) {
          const boundWitnessTransfer1 = boundWitnessTransferSerializer.deserialize(boundWitnessTransfer, packer);
          const boundWitnessTransfer2 = await boundWitness.incomingData(boundWitnessTransfer1, true);
          logger.info(step, packer.serialize(boundWitness, boundWitness.major, boundWitness.minor, true));

          const serializedUntypedTransfer2 = packer.serialize(
            boundWitnessTransfer2,
            boundWitnessTransferMajor,
            boundWitnessTransferMinor,
            false
          );

          const sizeBuffer = new Buffer(4);

          sizeBuffer.writeUInt32BE(serializedUntypedTransfer2.length + 4, 0);
          const transfer2Payload = Buffer.concat([
            sizeBuffer,
            serializedUntypedTransfer2
          ]);

          client.write(transfer2Payload);
        } else if (step === 2) {
          const boundWitnessTransfer3 = boundWitnessTransferSerializer.deserialize(boundWitnessTransfer, packer);
          const boundWitnessTransfer4 = await boundWitness.incomingData(boundWitnessTransfer3, false);
          logger.info(step, packer.serialize(boundWitness, boundWitness.major, boundWitness.minor, true));
          client.end(() => {
            resolve(boundWitness);
          });
        }

        data = undefined;
        sizeOfPayload = undefined;
        step += 1;
      }
    });
  }) as Promise<XyoBoundWitness>;
}
