/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 24th September 2018 11:23:29 am
 * @Email:  developer@xyfindables.com
 * @Filename: index.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 10th October 2018 2:16:10 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { IXyoOriginBlockRepository, XyoObject, XyoBoundWitness } from "@xyo-network/sdk-core-nodejs";

export interface XyoArchivistRepository extends IXyoOriginBlockRepository {
  getOriginBlocksByPublicKey(publicKey: XyoObject): Promise<XyoOriginBlocksByPublicKeyResult>;
}

export interface XyoOriginBlockResult {
  publicKeys: XyoObject[];
}

export interface XyoOriginBlocksByPublicKeyResult {
  publicKeys: XyoObject[];
  boundWitnesses: XyoBoundWitness[];
}
