/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Friday, 28th September 2018 3:35:47 pm
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-simple-bound-witness-success-listener.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 10th October 2018 2:16:45 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoBase, IXyoBoundWitnessSuccessListener, XyoBoundWitness, XyoPacker, IXyoHashProvider, IXyoOriginChainStateRepository, IXyoSignerProvider } from "@xyo-network/sdk-core-nodejs";
import { XyoBoundWitnessJsonVisualizer } from "./xyo-bound-witness-json-visualizer";

export class XyoSimpleBoundWitnessSuccessListener extends XyoBase implements IXyoBoundWitnessSuccessListener {

  constructor (
    private readonly packer: XyoPacker,
    private readonly hashProvider: IXyoHashProvider,
    private readonly originChainStateRepository: IXyoOriginChainStateRepository,
    private readonly signerProvider?: IXyoSignerProvider
  ) {
    super();
  }

  public async onBoundWitnessSuccess(boundWitness: XyoBoundWitness): Promise<void> {
    await new XyoBoundWitnessJsonVisualizer(this.packer, this.hashProvider, 'summary').visualize(boundWitness);
    if (this.signerProvider) {
      const nextSigner = this.signerProvider.newInstance();
      const pubKey = this.packer.serialize(nextSigner.publicKey, true).toString('hex');
      this.logInfo(`Rotating public key to ${pubKey}`);
      await this.originChainStateRepository.addSigner(nextSigner);
      await this.originChainStateRepository.removeOldestSigner();
    }
  }
}
