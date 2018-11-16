/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Friday, 28th September 2018 3:35:47 pm
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-simple-bound-witness-success-listener.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 14th November 2018 12:23:50 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoBase, IXyoBoundWitnessSuccessListener, XyoBoundWitness, IXyoHashProvider, IXyoOriginChainStateRepository, IXyoSignerProvider } from '@xyo-network/sdk-core-nodejs';

export class XyoSimpleBoundWitnessSuccessListener extends XyoBase implements IXyoBoundWitnessSuccessListener {

  private numberOfSuccessfulBoundWitnesses = 0;

  constructor (
    private readonly hashProvider: IXyoHashProvider,
    private readonly originChainStateRepository: IXyoOriginChainStateRepository,
    private readonly publicKeyRotationRate: number,
    private readonly signerProvider?: IXyoSignerProvider,
  ) {
    super();
  }

  public async onBoundWitnessSuccess(boundWitness: XyoBoundWitness): Promise<void> {
    this.numberOfSuccessfulBoundWitnesses += 1;
    this.logInfo(`Successfully created bound-witness\n\n${boundWitness.getReadableJSON()}`);

    if (this.signerProvider) {
      if (
        typeof this.publicKeyRotationRate === 'number' &&
        this.publicKeyRotationRate > 0
      ) {
        if (
          this.numberOfSuccessfulBoundWitnesses % this.publicKeyRotationRate  === 0) {
          const nextSigner = this.signerProvider.newInstance();
          const pubKey = nextSigner.publicKey.serialize(true).toString('hex');
          this.logInfo(`Rotating public key to ${pubKey}`);
          await this.originChainStateRepository.addSigner(nextSigner);
        }

        if (
          this.numberOfSuccessfulBoundWitnesses % this.publicKeyRotationRate === 1 &&
          this.numberOfSuccessfulBoundWitnesses !== 1
        ) {
          await this.originChainStateRepository.removeOldestSigner();
        }
      }
    }
  }
}
