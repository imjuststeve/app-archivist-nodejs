/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 15th October 2018 12:11:18 pm
 * @Email:  developer@xyfindables.com
 * @Filename: get-about-me-resolver.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 14th November 2018 12:23:50 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoBaseDataResolver } from "../xyo-base-data-resolver";
import { XyoDataResolver } from "../@types";
import { GraphQLResolveInfo } from "graphql";
import { XyoAboutMeService } from "@xyo-network/sdk-archivist-nodejs";
import { IXyoHashProvider } from '@xyo-network/sdk-core-nodejs';

export class GetAboutMeResolver extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

  constructor (
    private readonly aboutMeService: XyoAboutMeService,
    protected readonly hashProvider: IXyoHashProvider,
  ) {
    super(hashProvider);
  }

  public async resolve(obj: any, args: any, context: any, info: GraphQLResolveInfo): Promise<any> {
    this.logInfo(GetAboutMeResolver.stringify(args.aboutYou));
    return this.aboutMeService.getAboutMe(args.aboutYou);
  }
}
