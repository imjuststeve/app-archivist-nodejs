/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Thursday, 27th September 2018 11:55:25 am
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-simple-sentinel.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 11th October 2018 5:37:21 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import {
  XyoNode,
  IXyoOriginBlockRepository,
  XyoPeerConnectionProviderFactory,
  IXyoHashProvider,
  IXyoOriginChainStateRepository,
  XyoBoundWitnessPayloadProvider,
  IXyoNetworkProcedureCatalogue,
  IXyoPeerConnectionDelegate,
  IXyoBoundWitnessSuccessListener,
  XyoClientTcpNetwork,
  IXyoNetworkAddressProvider
} from "@xyo-network/sdk-core-nodejs";

export class XyoSimpleSentinel extends XyoNode {
  private readonly boundWitnessPayloadProvider: XyoBoundWitnessPayloadProvider;
  private readonly catalogue: IXyoNetworkProcedureCatalogue;
  private readonly network: XyoClientTcpNetwork;
  private readonly delegate: IXyoPeerConnectionDelegate;
  private readonly boundWitnessSuccessListener: IXyoBoundWitnessSuccessListener;

  constructor (
    networkAddressProvider: IXyoNetworkAddressProvider,
    hashingProvider: IXyoHashProvider,
    originChainStateRepository: IXyoOriginChainStateRepository,
    originBlocksRepository: IXyoOriginBlockRepository,
    boundWitnessSuccessListener: IXyoBoundWitnessSuccessListener,
    catalogue: IXyoNetworkProcedureCatalogue
  ) {

    const network = new XyoClientTcpNetwork(networkAddressProvider);
    const boundWitnessPayloadProvider = new XyoBoundWitnessPayloadProvider();

    const peerConnectionDelegate = new XyoPeerConnectionProviderFactory(
      network,
      catalogue,
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
    this.boundWitnessPayloadProvider = boundWitnessPayloadProvider;
    this.boundWitnessSuccessListener = boundWitnessSuccessListener;
  }
}
