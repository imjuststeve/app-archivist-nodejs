/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Thursday, 27th September 2018 11:55:25 am
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-simple-sentinel.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Tuesday, 2nd October 2018 10:59:25 am
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
  XyoBoundWitnessSuccessListener,
  XyoClientTcpNetwork,
  XyoNetworkAddressProvider
} from "@xyo-network/sdk-core-nodejs";

export class XyoSimpleSentinel extends XyoNode {
  private readonly boundWitnessPayloadProvider: XyoBoundWitnessPayloadProviderImpl;
  private readonly packer: XyoPacker;
  private readonly catalogue: XyoNetworkProcedureCatalogue;
  private readonly network: XyoClientTcpNetwork;
  private readonly delegate: XyoPeerConnectionDelegate;
  private readonly boundWitnessSuccessListener: XyoBoundWitnessSuccessListener;

  constructor (
    networkAddressProvider: XyoNetworkAddressProvider,
    hashingProvider: XyoHashProvider,
    originChainStateRepository: XyoOriginChainStateRepository,
    originBlocksRepository: XyoOriginBlockRepository,
    boundWitnessSuccessListener: XyoBoundWitnessSuccessListener,
    packer: XyoPacker,
    catalogue: XyoNetworkProcedureCatalogue
  ) {

    const network = new XyoClientTcpNetwork(networkAddressProvider);
    const boundWitnessPayloadProvider = new XyoBoundWitnessPayloadProviderImpl();

    const peerConnectionDelegate = new XyoPeerConnectionProviderFactory(
      network,
      catalogue,
      packer,
      hashingProvider,
      originChainStateRepository,
      originBlocksRepository,
      boundWitnessPayloadProvider,
      boundWitnessSuccessListener,
      false
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
