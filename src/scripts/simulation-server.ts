/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 10th September 2018 10:30:50 am
 * @Email:  developer@xyfindables.com
 * @Filename: main.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 19th September 2018 12:00:05 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company`
 */

import {
  XyoNode,
  XyoDefaultPackerProvider,
  XyoServerTcpNetwork,
  XyoNetworkProcedureCatalogue,
  CatalogueItem,
  XyoFileSystemStorageProvider,
  XyoRSASha256SignerProvider,
  XyoSigner,
  XyoSha256HashProvider,
  XyoPeerConnectionProviderFactory,
  XyoOriginChainNavigator,
  XyoOriginChainStateManager,
  XyoBoundWitnessPayloadProviderImpl
} from '../../../sdk-core-nodejs';

if (require.main === module) {
  main(parseInt(process.argv[2], 10));
}

async function main(port: number) {
  const packerProvider = new XyoDefaultPackerProvider();
  const packer = packerProvider.getXyoPacker();
  const network = new XyoServerTcpNetwork(port);

  const catalogue: XyoNetworkProcedureCatalogue = {
    canDo(catalogueItem: CatalogueItem) {
      return catalogueItem === CatalogueItem.BOUND_WITNESS;
    }
  };

  const originBlocksStorageProvider = new XyoFileSystemStorageProvider(
    `/Users/ryan/dev/projects/sdk-archivist-nodejs/data/${port}/origin-blocks`
  );

  const originBlockNextHashStorageProvider = new XyoFileSystemStorageProvider(
    `/Users/ryan/dev/projects/sdk-archivist-nodejs/data/${port}/next-hash-index`
  );

  const hashingProvider = new XyoSha256HashProvider();
  const signerProvider = new XyoRSASha256SignerProvider();
  const signers: XyoSigner[] = [signerProvider.newInstance()];

  const originChainStateManager = new XyoOriginChainStateManager(0);
  const originChainNavigator = new XyoOriginChainNavigator(
    packer,
    originBlocksStorageProvider,
    originBlockNextHashStorageProvider,
    hashingProvider
  );
  const boundWitnessPayloadProvider = new XyoBoundWitnessPayloadProviderImpl();

  const peerConnectionDelegateFactory = new XyoPeerConnectionProviderFactory(
    network,
    catalogue,
    packer,
    signers,
    hashingProvider,
    originChainStateManager,
    originChainNavigator,
    boundWitnessPayloadProvider
  );

  const archivist = new XyoNode(peerConnectionDelegateFactory.newInstance());
  archivist.start();
}
