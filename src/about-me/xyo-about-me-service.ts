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
import { XyoBase, XyoIpService } from "@xyo-network/sdk-core-nodejs";
import uuid = require("uuid");

export class XyoAboutMeService extends XyoBase {
  private name?: string;

  constructor (
    private readonly ipService: XyoIpService,
    private readonly version: string,
    private readonly isPubliclyAddressable: boolean,
    name?: string
  ) {
    super();

    if (name) {
      this.name = name;
    }
  }

  public async getAboutMe(): Promise<IXyoAboutMe> {
    const ip = await this.ipService.getMyIp();
    this.name = this.name || uuid();

    return {
      name: this.name,
      version: this.version,
      ip: this.isPubliclyAddressable ? ip.public : ip.external,
      graphqlPort: ip.graphqlPort,
      nodePort: ip.nodePort
    };
  }
}
