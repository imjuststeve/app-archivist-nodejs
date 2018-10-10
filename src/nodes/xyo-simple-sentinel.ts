/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Thursday, 27th September 2018 11:55:25 am
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-simple-sentinel.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 10th October 2018 3:32:34 pm
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
  XyoPacker,
  IXyoNetworkProcedureCatalogue,
  IXyoPeerConnectionDelegate,
  IXyoBoundWitnessSuccessListener,
  XyoClientTcpNetwork,
  IXyoNetworkAddressProvider
} from "@xyo-network/sdk-core-nodejs";

export class XyoSimpleSentinel extends XyoNode {
  private readonly boundWitnessPayloadProvider: XyoBoundWitnessPayloadProvider;
  private readonly packer: XyoPacker;
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
    packer: XyoPacker,
    catalogue: IXyoNetworkProcedureCatalogue
  ) {

    const network = new XyoClientTcpNetwork(networkAddressProvider);
    const boundWitnessPayloadProvider = new XyoBoundWitnessPayloadProvider();

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
