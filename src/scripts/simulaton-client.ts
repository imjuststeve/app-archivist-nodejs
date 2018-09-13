/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 10th September 2018 11:07:23 am
 * @Email:  developer@xyfindables.com
 * @Filename: client.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 13th September 2018 2:09:05 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import net from 'net';

import {
  CatalogueItem,
  bufferToCatalogueItems,
  XyoZigZagBoundWitness,
  TestRSASha256Signer,
  TestRSASha256Signature,
  XyoPayload,
  XyoMultiTypeArrayInt,
  XyoRssi,
  XyoBoundWitnessTransfer,
  XyoBoundWitness,
  XyoBasicHashBaseCreator
} from 'xyo-sdk-core';

const logger = console;
if (require.main === module) {
  main();
}

async function main() {
  TestRSASha256Signature.creator.enable();
  const hasher = new XyoBasicHashBaseCreator('sha512', 64, 0x0d);

  const boundWitness = await doBoundWitnessWithServer(8088, new XyoPayload(
    new XyoMultiTypeArrayInt([new XyoRssi(10)]),
    new XyoMultiTypeArrayInt([new XyoRssi(10)])
  ));

  // const boundWitnessBlocks = new XyoSingleTypeArrayInt(
  //   XyoBoundWitness.creator.major,
  //   XyoBoundWitness.creator.minor,
  //   [boundWitness]
  // );

  // const hash = await hasher.createHash(boundWitnessBlocks.unTyped.value!);

  // const payload = new XyoPayload(
  //   new XyoMultiTypeArrayInt([hash.value!]),
  //   new XyoMultiTypeArrayInt([boundWitnessBlocks])
  // );

  // setTimeout(async () => {
  //   await doBoundWitnessWithServer(8088, payload);
  // }, 3000);
}

async function doBoundWitnessWithServer(port: number, payload: XyoPayload): Promise<XyoBoundWitness> {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ port }, () => {
      logger.info(`Connection created`);
      client.write(
        Buffer.from([
          0x00, 0x00, 0x00, 0x09, // size of payload
          0x04, // size of catalogue in bytes
          0x00, 0x00, 0x00, 0x01 // my catalogue (BOUND_WITNESS)
        ])
      );
    });

    let data: Buffer | undefined;
    let sizeOfData: number | undefined;
    let step = 0;

    const boundWitness: XyoZigZagBoundWitness = new XyoZigZagBoundWitness(
      [new TestRSASha256Signer()],
      payload
    );

    // tslint:disable-next-line:ter-prefer-arrow-callback
    client.on('data', async function listener(chunk) {
      logger.info(`Data received, Step: ${step}, chunkLength: ${chunk.length}`);
      data = data || new Buffer(0);

      data = Buffer.concat([
        data,
        chunk
      ]);

      if (data.length < 4) {
        return;
      }

      if (sizeOfData === undefined) {
        sizeOfData = data.readUInt32BE(0);
        logger.info(`Step ${step}, expected size: ${sizeOfData}`);
      }

      if (sizeOfData === data.length) {
        logger.info(`Full amount of data received, Step: ${step}, Data length: ${sizeOfData}`);
        if (step === 0) {
          logger.info(`Step 1 of Bound Witness started`);

          const serverChoseItem = bufferToCatalogueItems(data.slice(4 + 1, 4 + 1 + 4));
          if (serverChoseItem.length !== 1 && serverChoseItem[0] !== CatalogueItem.BOUND_WITNESS) {
            throw new Error(`Can not parse server catalogue items`);
          }

          const serverBoundWitnessTransfer = data.slice(9);
          const transfer = XyoBoundWitnessTransfer.creator.createFromPacked(serverBoundWitnessTransfer);
          const outgoing = await boundWitness.incomingData(transfer, true);
          const outgoingBytes = outgoing.unTyped;
          const sizeBuffer = new Buffer(4);

          sizeBuffer.writeUInt32BE(4 + outgoingBytes.length, 0);
          const outgoingPayload = Buffer.concat([
            sizeBuffer,
            outgoingBytes
          ]);

          step += 1;
          sizeOfData = undefined;
          data = undefined;

          logger.info(`Sending Step 1 of Bound-Witness, ${outgoingPayload.length}`);
          client.write(outgoingPayload);
        } else if (step === 1) {
          logger.info(`Step 2 of Bound Witness started`);
          const serverBoundWitnessTransfer = data.slice(4);
          step += 1;
          sizeOfData = undefined;
          data = undefined;
          logger.info(`Step 2 Bound witness received data`);
          const transfer = XyoBoundWitnessTransfer.creator.createFromPacked(serverBoundWitnessTransfer);
          await boundWitness.incomingData(transfer, false);
          logger.info(`Bound Witness complete`);
          client.removeListener('data', listener);
          client.end();
          return resolve(boundWitness);
        }
      }
    });
  }) as Promise<XyoBoundWitness>;
}
