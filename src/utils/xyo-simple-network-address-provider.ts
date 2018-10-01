/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Friday, 28th September 2018 2:07:02 pm
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-simple-network-address-provider.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Friday, 28th September 2018 2:07:41 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoNetworkAddressProvider } from "xyo-sdk-core";

export class XyoSimpleNetworkAddressProvider implements XyoNetworkAddressProvider {
  private index = 0;

  // tslint:disable-next-line:prefer-array-literal
  constructor(private readonly addresses: Array<{port: number, host: string}>) {}

  public async next() {
    const networkAddress = this.addresses[this.index % this.addresses.length];
    this.index += 1;
    return networkAddress;
  }
}
