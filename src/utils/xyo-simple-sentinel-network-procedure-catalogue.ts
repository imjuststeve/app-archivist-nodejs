/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Friday, 28th September 2018 3:32:43 pm
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-simple-sentinel-network-procedure-catalogue.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Monday, 8th October 2018 5:17:31 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoNetworkProcedureCatalogue, CatalogueItem } from "@xyo-network/sdk-core-nodejs";

export class XyoSimpleSentinelNetworkProcedureCatalogue implements XyoNetworkProcedureCatalogue {

  public canDo(catalogueItem: CatalogueItem) {
    return catalogueItem === CatalogueItem.BOUND_WITNESS;
  }

  public getCurrentCatalogue() {
    return [CatalogueItem.BOUND_WITNESS];
  }
}
