/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Thursday, 27th September 2018 10:30:06 am
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-archivist.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Friday, 28th September 2018 2:59:00 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import {
  XyoNode,
  XyoOriginBlockRepository,
  XyoServerTcpNetwork,
  CatalogueItem,
  XyoPeerConnectionProviderFactory,
  XyoDefaultPackerProvider,
  XyoSigner,
  XyoHashProvider,
  XyoOriginChainStateRepository,
  XyoBoundWitnessPayloadProviderImpl,
  XyoPacker,
  XyoNetworkProcedureCatalogue,
  XyoPeerConnectionDelegate,
  XyoBoundWitnessSuccessListener
} from "xyo-sdk-core";

export class XyoArchivist extends XyoNode {

  private readonly boundWitnessPayloadProvider: XyoBoundWitnessPayloadProviderImpl;
  private readonly packer: XyoPacker;
  private readonly catalogue: XyoNetworkProcedureCatalogue;
  private readonly network: XyoServerTcpNetwork;
  private readonly delegate: XyoPeerConnectionDelegate;
  private readonly boundWitnessSuccessListener: XyoBoundWitnessSuccessListener;

  constructor (
    port: number,
    hashingProvider: XyoHashProvider,
    originChainStateRepository: XyoOriginChainStateRepository,
    originBlocksRepository: XyoOriginBlockRepository,
    boundWitnessSuccessListener: XyoBoundWitnessSuccessListener,
    packer: XyoPacker
  ) {
    const network = new XyoServerTcpNetwork(port);
    const boundWitnessPayloadProvider = new XyoBoundWitnessPayloadProviderImpl();

    const catalogue: XyoNetworkProcedureCatalogue = {
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
      packer,
      hashingProvider,
      originChainStateRepository,
      originBlocksRepository,
      boundWitnessPayloadProvider,
      boundWitnessSuccessListener,
      true
    ).newInstance();

    super(peerConnectionDelegate);

    this.delegate = peerConnectionDelegate;
    this.network = network;
    this.catalogue = catalogue;
    this.packer = packer;
    this.boundWitnessPayloadProvider = boundWitnessPayloadProvider;
    this.boundWitnessSuccessListener = boundWitnessSuccessListener;
  }
}
