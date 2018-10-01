/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Friday, 28th September 2018 3:32:43 pm
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-simple-sentinel-network-procedure-catalogue.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Friday, 28th September 2018 3:34:19 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoNetworkProcedureCatalogue, CatalogueItem } from "xyo-sdk-core";

export class XyoSimpleSentinelNetworkProcedureCatalogue implements XyoNetworkProcedureCatalogue {

  public canDo(catalogueItem: CatalogueItem) {
    return catalogueItem === CatalogueItem.BOUND_WITNESS || catalogueItem === CatalogueItem.TAKE_ORIGIN_CHAIN;
  }

  public getCurrentCatalogue() {
    return [CatalogueItem.BOUND_WITNESS, CatalogueItem.GIVE_ORIGIN_CHAIN];
  }
}
