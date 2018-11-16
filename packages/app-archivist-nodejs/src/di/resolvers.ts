/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Thursday, 15th November 2018 1:32:07 pm
 * @Email:  developer@xyfindables.com
 * @Filename: resolvers.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 15th November 2018 1:50:17 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

// tslint:disable:variable-name

import { XyoDependencyInjectionContainer } from "./dependency-injection-container";
import { XyoArchivistConfig } from "../configuration";

export async function getXyoSha256HashProvider(
  container: XyoDependencyInjectionContainer,
  config: XyoArchivistConfig
) {
  const sdkCoreNodeJs = await import('@xyo-network/sdk-core-nodejs');
  return sdkCoreNodeJs.getHashingProvider('sha256');
}

export async function getXyoEcdsaSecp256k1Sha256SignerProvider(
  container: XyoDependencyInjectionContainer,
  config: XyoArchivistConfig
) {
  const sdkCoreNodeJs = await import('@xyo-network/sdk-core-nodejs');
  const hashProvider = await container.get('XyoSha256HashProvider');

  // @ts-ignore
  return new sdkCoreNodeJs.XyoEcdsaSecp256k1Sha256SignerProvider(hashProvider); // TODO
}
