/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 24th September 2018 11:23:29 am
 * @Email:  developer@xyfindables.com
 * @Filename: index.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Monday, 24th September 2018 11:37:09 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoOriginBlockRepository } from "../../../sdk-core-nodejs/dist/origin-chain/xyo-origin-chain-types";
import { XyoObject, XyoBoundWitness } from "../../../sdk-core-nodejs";

export interface XyoArchivistRepository extends XyoOriginBlockRepository {
  getOriginBlocksWithPublicKey(publicKey: XyoObject): Promise<XyoBoundWitness[]>;
}

export interface XyoOriginBlockResult {
  publicKeys: XyoObject[];
}
