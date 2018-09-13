/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 10th September 2018 10:30:50 am
 * @Email:  developer@xyfindables.com
 * @Filename: main.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 13th September 2018 10:47:44 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company`
 */

import {
  XyoNode,
  TestRSASha256Signer,
  TestRSASha256Signature,
  XyoServerTcpNetwork,
  CatalogueItem,
  XyoBasicHashBaseCreator,
  XyoRssi,
  FileSystemStorageProvider
} from 'xyo-sdk-core';

if (require.main === module) {
  main();
}

async function main() {
  process.on('unhandledRejection', (reason, promise) => {
    // tslint:disable-next-line:no-console
    console.log('Unhandled Rejection at:', reason.stack || reason);
  });
  TestRSASha256Signature.creator.enable();

  const signers = [new TestRSASha256Signer()];
  const network = new XyoServerTcpNetwork(8088);
  const storageProvider = new FileSystemStorageProvider('/Users/ryan/dev/projects/sdk-archivist-nodejs/data');
  const hasher = new XyoBasicHashBaseCreator('sha512', 64, 0x0d);

  const catalogue = {
    canDo: (catalogueItem: CatalogueItem) => {
      return catalogueItem === CatalogueItem.BOUND_WITNESS;
    }
  };

  const archivist = new XyoNode(network, catalogue, signers, storageProvider, hasher);
  archivist.addHeuristicsProvider('rssi', async () => {
    return new XyoRssi(10);
  });

  archivist.start();
}
