/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 24th September 2018 11:23:29 am
 * @Email:  developer@xyfindables.com
 * @Filename: index.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Friday, 5th October 2018 10:49:47 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoOriginBlockRepository, XyoObject, XyoBoundWitness } from "@xyo-network/sdk-core-nodejs";

export interface XyoArchivistRepository extends XyoOriginBlockRepository {
  getOriginBlocksByPublicKey(publicKey: XyoObject): Promise<XyoOriginBlocksByPublicKeyResult>;
}

export interface XyoOriginBlockResult {
  publicKeys: XyoObject[];
}

export interface XyoOriginBlocksByPublicKeyResult {
  publicKeys: XyoObject[];
  boundWitnesses: XyoBoundWitness[];
}
