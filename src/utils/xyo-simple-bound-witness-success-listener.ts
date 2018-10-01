/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Friday, 28th September 2018 3:35:47 pm
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-simple-bound-witness-success-listener.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Friday, 28th September 2018 3:37:52 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoBase, XyoBoundWitnessSuccessListener, XyoBoundWitness, XyoPacker, XyoHashProvider } from "xyo-sdk-core";
import { XyoBoundWitnessJsonVisualizer } from "./xyo-bound-witness-json-visualizer";

export class XyoSimpleBoundWitnessSuccessListener extends XyoBase implements XyoBoundWitnessSuccessListener {

  constructor (private readonly packer: XyoPacker, private readonly hashProvider: XyoHashProvider) {
    super();
  }

  public async onBoundWitnessSuccess(boundWitness: XyoBoundWitness): Promise<void> {
    await new XyoBoundWitnessJsonVisualizer(this.packer, this.hashProvider, 'summary').visualize(boundWitness);
  }
}
