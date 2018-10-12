/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Thursday, 27th September 2018 10:30:06 am
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-archivist.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 11th October 2018 4:28:50 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import {
  XyoNode,
  IXyoOriginBlockRepository,
  XyoServerTcpNetwork,
  CatalogueItem,
  XyoPeerConnectionProviderFactory,
  IXyoHashProvider,
  IXyoOriginChainStateRepository,
  XyoBoundWitnessPayloadProvider,
  IXyoNetworkProcedureCatalogue,
  IXyoPeerConnectionDelegate,
  IXyoBoundWitnessSuccessListener
} from "@xyo-network/sdk-core-nodejs";

export class XyoArchivist extends XyoNode {

  private readonly boundWitnessPayloadProvider: XyoBoundWitnessPayloadProvider;
  private readonly catalogue: IXyoNetworkProcedureCatalogue;
  private readonly network: XyoServerTcpNetwork;
  private readonly delegate: IXyoPeerConnectionDelegate;
  private readonly boundWitnessSuccessListener: IXyoBoundWitnessSuccessListener;

  constructor (
    port: number,
    hashingProvider: IXyoHashProvider,
    originChainStateRepository: IXyoOriginChainStateRepository,
    originBlocksRepository: IXyoOriginBlockRepository,
    boundWitnessSuccessListener: IXyoBoundWitnessSuccessListener
  ) {
    const network = new XyoServerTcpNetwork(port);
    const boundWitnessPayloadProvider = new XyoBoundWitnessPayloadProvider();

    const catalogue: IXyoNetworkProcedureCatalogue = {
      canDo(catalogueItem: CatalogueItem) {
        return catalogueItem === CatalogueItem.BOUND_WITNESS || catalogueItem === CatalogueItem.GIVE_ORIGIN_CHAIN;
      },
      getCurrentCatalogue() {
        return [
          CatalogueItem.BOUND_WITNESS,
          CatalogueItem.GIVE_ORIGIN_CHAIN
        ];
      }
    };

    const peerConnectionDelegate = new XyoPeerConnectionProviderFactory(
      network,
      catalogue,
      hashingProvider,
      originChainStateRepository,
      originBlocksRepository,
      boundWitnessPayloadProvider,
      boundWitnessSuccessListener,
      true,
      {
        resolveCategory: (catalogueItems: CatalogueItem[]): CatalogueItem | undefined => {
          if (!catalogueItems || catalogueItems.length < 1) {
            return undefined;
          }
          const wantsToGiveOriginChain = Boolean(catalogueItems.find(item => item === CatalogueItem.GIVE_ORIGIN_CHAIN));
          if (wantsToGiveOriginChain) {
            return CatalogueItem.TAKE_ORIGIN_CHAIN;
          }

          if (catalogueItems && catalogueItems.length) {
            return catalogueItems[catalogueItems.length - 1];
          }
          return undefined;
        }
      }
    ).newInstance();

    super(peerConnectionDelegate);

    this.delegate = peerConnectionDelegate;
    this.network = network;
    this.catalogue = catalogue;
    this.boundWitnessPayloadProvider = boundWitnessPayloadProvider;
    this.boundWitnessSuccessListener = boundWitnessSuccessListener;
  }
}
