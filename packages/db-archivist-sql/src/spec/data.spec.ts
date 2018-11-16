/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Wednesday, 24th October 2018 5:06:59 pm
 * @Email:  developer@xyfindables.com
 * @Filename: data.spec.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Friday, 16th November 2018 3:07:27 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { SqlService } from '../sql.service';
import {
  XyoZigZagBoundWitness,
  XyoRsaSha256SignerProvider,
  XyoRssi,
  XyoIndex,
  IXyoHashProvider,
  XyoHash,
  XyoPreviousHash,
  IXyoObject,
  IXyoSigner,
  XyoNextPublicKey,
  getHashingProvider,
  createPayload,
  deserialize
} from '@xyo-network/sdk-core-nodejs';
import _ from 'lodash';
import { XyoArchivistSqlRepository } from '../xyo-archivist-sql-repository';

jest.setTimeout(100000);
describe(`SQL Archivist`, () => {
  it(`Should persist data`, async () => {
    const hashProvider = getHashingProvider('sha256');
    const sqlCredentials = {
      host: process.env.SQL__HOST || '127.0.0.1',
      user: process.env.SQL__USER || 'ryan',
      password: process.env.SQL__PASSWORD || 'password',
      database: process.env.SQL__DATABASE || 'Xyo',
      port: process.env.SQL__PORT && parseInt(process.env.SQL__PORT, 10) || 3306,
    };

    const sqlService = new SqlService(sqlCredentials);

    const sqlArchivist = new XyoArchivistSqlRepository(sqlService);
    const signerProvider = new XyoRsaSha256SignerProvider();
    const bobEntitySigner = signerProvider.newInstance();
    const aliceEntitySigner = signerProvider.newInstance();
    let bobSigners = [bobEntitySigner];
    let aliceSigners = [aliceEntitySigner];
    let bobNextSigner = signerProvider.newInstance();
    let aliceNextSigner = signerProvider.newInstance();

    const result = await createBoundWitness(
      hashProvider,
      { signers: bobSigners, index: 0, rssi: -10, nextSigner: bobNextSigner },
      { signers: aliceSigners, index: 0, rssi: -10, nextSigner: aliceNextSigner }
    );

    bobSigners = [bobNextSigner];
    aliceSigners = [aliceNextSigner];

    bobNextSigner = signerProvider.newInstance();
    aliceNextSigner = signerProvider.newInstance();

    const result2 = await createBoundWitness(
      hashProvider,
      { signers: bobSigners, index: 1, rssi: -15, previousHash: result.hash, nextSigner: bobNextSigner  },
      { signers: aliceSigners, index: 1, rssi: -12, previousHash: result.hash, nextSigner: aliceNextSigner }
    );

    bobSigners = [bobNextSigner];
    aliceSigners = [aliceNextSigner];

    bobNextSigner = signerProvider.newInstance();
    aliceNextSigner = signerProvider.newInstance();

    const result3 = await createBoundWitness(
      hashProvider,
      { signers: bobSigners, index: 2, rssi: -20, previousHash: result2.hash, nextSigner: bobNextSigner  },
      { signers: aliceSigners, index: 2, rssi: -14, previousHash: result2.hash, nextSigner: aliceNextSigner }
    );

    const startTime = new Date().valueOf();
    await sqlArchivist.addOriginBlock(result.hash, result.originBlock);
    await sqlArchivist.addOriginBlock(result3.hash, result3.originBlock);
    await sqlArchivist.addOriginBlock(result2.hash, result2.originBlock);
    const endTime = new Date().valueOf();

    const query = await sqlArchivist.getOriginBlocksByPublicKey(bobSigners[0].publicKey);
    expect(query.publicKeys.length).toBe(3);
    expect(query.boundWitnesses.length).toBe(3);
    expect(query.boundWitnesses[0].isEqual(result.originBlock)).toBe(true);
    expect(query.boundWitnesses[1].isEqual(result2.originBlock)).toBe(true);
    expect(query.boundWitnesses[2].isEqual(result3.originBlock)).toBe(true);

    const entities = (await sqlArchivist.getEntities(1000, undefined)).list;
    expect(entities.length).toBe(2);

    expect(
      deserialize(Buffer.from(entities[0].firstKnownPublicKey, 'hex')).isEqual(bobEntitySigner.publicKey)
    ).toBe(true);

    expect(
      deserialize(Buffer.from(entities[1].firstKnownPublicKey, 'hex')).isEqual(aliceEntitySigner.publicKey)
    ).toBe(true);
    expect(await sqlArchivist.containsOriginBlock(result.hash.serialize(true))).toBe(true);
    expect(await sqlArchivist.containsOriginBlock(result.hash.serialize(true).slice(1))).toBe(false);

    const hashes = await sqlArchivist.getAllOriginBlockHashes();

    const foundFirst = _.find(hashes, (hash) => {
      return result.hash.serialize(true).equals(hash);
    });

    const foundSecond = _.find(hashes, (hash) => {
      return result2.hash.serialize(true).equals(hash);
    });

    const foundThird = _.find(hashes, (hash) => {
      return result3.hash.serialize(true).equals(hash);
    });

    expect(foundFirst).toBeTruthy();
    expect(foundSecond).toBeTruthy();
    expect(foundThird).toBeTruthy();

    let originBlockResults = await sqlArchivist.getOriginBlocks(2);
    expect(originBlockResults.totalSize).toBe(3);
    expect(originBlockResults.hasNextPage).toBe(true);
    expect(originBlockResults.list.length).toBe(2);

    originBlockResults = await sqlArchivist.getOriginBlocks(1, result.hash.serialize(true));
    expect(originBlockResults.totalSize).toBe(3);
    expect(originBlockResults.hasNextPage).toBe(true);
    expect(originBlockResults.list.length).toBe(1);
    expect(originBlockResults.list[0].isEqual(result3.originBlock)).toBe(true);

    await sqlArchivist.removeOriginBlock(result3.hash.serialize(true));
    await sqlArchivist.removeOriginBlock(result2.hash.serialize(true));
    await sqlArchivist.removeOriginBlock(result.hash.serialize(true));

    await sqlService.stop();
  });
});

async function createBoundWitness(
  hashProvider: IXyoHashProvider,
  bob: {
    nextSigner?: IXyoSigner,
    signers: IXyoSigner[],
    index: number,
    previousHash?: XyoHash,
    rssi: number
  },
  alice: {
    nextSigner?: IXyoSigner,
    signers: IXyoSigner[],
    index: number,
    previousHash?: XyoHash,
    rssi: number
  },
) {
  const bobSignedPayloadItems: IXyoObject[] = [new XyoRssi(bob.rssi), new XyoIndex(bob.index)];
  if (bob.previousHash) {
    bobSignedPayloadItems.push(new XyoPreviousHash(bob.previousHash));
  }

  if (bob.nextSigner) {
    bobSignedPayloadItems.push(new XyoNextPublicKey(bob.nextSigner.publicKey));
  }

  const bobPayload = createPayload(bobSignedPayloadItems, []);

  const aliceSignedPayloadItems: IXyoObject[] = [new XyoRssi(alice.rssi), new XyoIndex(alice.index)];

  if (alice.previousHash) {
    aliceSignedPayloadItems.push(new XyoPreviousHash(alice.previousHash));
  }

  if (alice.nextSigner) {
    aliceSignedPayloadItems.push(new XyoNextPublicKey(alice.nextSigner.publicKey));
  }

  const alicePayload = createPayload(aliceSignedPayloadItems, []);

  const bobBoundWitness = new XyoZigZagBoundWitness(bob.signers, bobPayload);
  const aliceBoundWitness = new XyoZigZagBoundWitness(alice.signers, alicePayload);

  const transfer1 = await bobBoundWitness.incomingData(undefined, false);
  const transfer2 = await aliceBoundWitness.incomingData(transfer1, true);
  const transfer3 = await bobBoundWitness.incomingData(transfer2, false);
  const transfer4 = await aliceBoundWitness.incomingData(transfer3, false);
  const hash = await bobBoundWitness.getHash(hashProvider);

  return {
    hash,
    originBlock: bobBoundWitness
  };
}
