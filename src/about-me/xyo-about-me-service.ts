/*
* @Author: XY | The Findables Company <ryanxyo>
* @Date:   Friday, 26th October 2018 2:35:41 pm
* @Email:  developer@xyfindables.com
* @Filename: xyo-about-me.ts
* @Last modified by:
* @Last modified time:
* @License: All Rights Reserved
* @Copyright: Copyright XY | The Findables Company
*/

import { IXyoAboutMe } from "../xyo-archivist-repository";
import { XyoBase, XyoIpService, IXyoPublicKey } from "@xyo-network/sdk-core-nodejs";
import uuid = require("uuid");

export class XyoAboutMeService extends XyoBase {
  private readonly name: string;
  private readonly ipOverride?: string;

  constructor (
    private readonly ipService: XyoIpService,
    private readonly version: string,
    private readonly isPubliclyAddressable: boolean,
    private readonly genesisPublicKey: IXyoPublicKey,
    options?: {
      name?: string,
      publicIpOverride?: string
    }
  ) {
    super();

    this.name = (options && options.name) || uuid();
    this.ipOverride = (options && options.publicIpOverride) || undefined;
  }

  public async getAboutMe(): Promise<IXyoAboutMe> {
    const ip = await this.ipService.getMyIp();

    return {
      name: this.name,
      version: this.version,
      ip: this.ipOverride || (this.isPubliclyAddressable ? ip.public : ip.external),
      graphqlPort: ip.graphqlPort,
      nodePort: ip.nodePort,
      address: this.genesisPublicKey.serialize(true).toString('hex')
    };
  }
}
