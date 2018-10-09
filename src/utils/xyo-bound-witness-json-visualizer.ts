/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Friday, 28th September 2018 12:14:21 pm
 * @Email:  developer@xyfindables.com
 * @Filename: bound-witness-json-visualizer.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Monday, 8th October 2018 5:03:37 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoPacker, XyoBoundWitness, XyoHashProvider, XyoBase } from "@xyo-network/sdk-core-nodejs";

export class XyoBoundWitnessJsonVisualizer extends XyoBase {
  constructor (
    private readonly packer: XyoPacker,
    private readonly hashProvider: XyoHashProvider,
    private readonly type: 'json' | 'summary'
  ) {
    super();
  }

  public async visualize(boundWitness: XyoBoundWitness) {
    const publicKeys = boundWitness.publicKeys.map((publicKeySet) => {
      return publicKeySet.array.map((publicKey) => {
        return this.packer.serialize(publicKey, true).toString('hex');
      });
    });

    const signatures = boundWitness.signatures.map((signatureSet) => {
      return signatureSet.array.map((signature) => {
        return this.packer.serialize(signature, true).toString('hex');
      });
    });

    const signedPayloads = boundWitness.payloads.map((payloads) => {
      return payloads.signedPayload.array.map((signedPayload) => {
        return this.packer.serialize(signedPayload, true).toString('hex');
      });
    });

    const unsignedPayloads = boundWitness.payloads.map((payloads) => {
      return payloads.unsignedPayload.array.map((unsignedPayload) => {
        return this.packer.serialize(unsignedPayload, true).toString('hex');
      });
    });

    const hash = await boundWitness.getHash(this.hashProvider);
    const serializedHash = this.packer.serialize(hash, true).toString('hex');
    if (this.type === 'json') {
      const json = JSON.stringify({
        publicKeys,
        signatures,
        signedPayloads,
        unsignedPayloads,
        hash: serializedHash
      }, null, '\t');
      this.logInfo(json);
    } else {
      const joinedPublicKeys = publicKeys.join(', ');
      this.logInfo(`BoundWitness created with keys: ${joinedPublicKeys} with hash ${serializedHash}`);
    }
  }
}
