/*
* @Author: XY | The Findables Company <ryanxyo>
* @Date:   Friday, 26th October 2018 2:35:41 pm
* @Email:  developer@xyfindables.com
* @Filename: xyo-about-me.ts
* @Last modified by:
* @Last modified time:
* @License: All Rights Reserved
* @Copyright: Copyright XY | The Findables Company
*/

import { IXyoAboutMe } from "../xyo-archivist-repository";
import { XyoBase, XyoIpService, IXyoPublicKey, XyoPeerDiscoveryService, IPeerDescriptionWithPeers } from '@xyo-network/sdk-core-nodejs';
import uuid = require("uuid");

export class XyoAboutMeService extends XyoBase {
  private readonly name: string;
  private readonly ipOverride?: string;
  private peers: {
    collection: IPeer[],
    byName: {
      [s: string]: number
    },
    byNetworkId: {
      [s: string]: number
    },
    byAddress: {
      [s: string]: number
    }
  } = {
    collection: [],
    byName: {},
    byNetworkId: {},
    byAddress: {}
  };
  private peerDescription?: IPeerDescriptionWithPeers;

  constructor (
    private readonly ipService: XyoIpService,
    private readonly version: string,
    private readonly isPubliclyAddressable: boolean,
    private readonly genesisPublicKey: IXyoPublicKey,
    private readonly peerDiscoverService: XyoPeerDiscoveryService,
    options?: {
      name?: string,
      publicIpOverride?: string
    }
  ) {
    super();

    this.name = (options && options.name) || uuid();
    this.ipOverride = (options && options.publicIpOverride) || undefined;
  }

  public async getAboutMe(aboutYou?: IPeerDescriptionWithPeers): Promise<IXyoAboutMe> {
    const ip = await this.ipService.getMyIp();

    const me = {
      name: this.name,
      version: this.version,
      ip: this.ipOverride || (this.isPubliclyAddressable ? ip.public : ip.external),
      graphqlPort: ip.graphqlPort,
      nodePort: ip.nodePort,
      address: this.genesisPublicKey.serialize(true).toString('hex'),
      peers: this.peers.collection
    };

    if (aboutYou) {
      this.peerDiscoverService.addPeerCandidate({
        ip: aboutYou.ip,
        port: aboutYou.graphqlPort
      });

      // Vet peers of peers
      if (
        aboutYou.peers &&
        aboutYou.peers &&
        aboutYou.peers instanceof Array &&
        aboutYou.peers.length > 0
      ) {
        aboutYou.peers.forEach((p) => {
          this.peerDiscoverService.addPeerCandidate({
            ip: p.ip,
            port: p.graphqlPort
          });
        });
      }
    }

    this.peerDescription = {
      name: me.name,
      version: this.version,
      ip: (this.ipOverride || (this.isPubliclyAddressable ? ip.public : ip.external)) || 'N/A',
      graphqlPort: me.graphqlPort || -1,
      nodePort: me.nodePort || -1,
      address: me.address,
      peers: this.peers.collection
    };

    this.peerDiscoverService.updatePeerDescription(this.peerDescription);

    return me;
  }

  public startDiscoveringPeers() {
    const stop = this.peerDiscoverService.findPeers((peer) => {
      const networkId = `${peer.ip}:${peer.graphqlPort}`;
      if (
        !this.peers.byAddress[peer.address] &&
        !this.peers.byNetworkId[networkId] &&
        !this.peers.byName[peer.name]
      ) {
        const index = this.peers.collection.length;
        this.peers.collection.push(peer);
        this.peers.byAddress[peer.address] = index;
        this.peers.byNetworkId[networkId] = index;
        this.peers.byName[peer.name] = index;

        if (this.peerDescription) {
          this.peerDiscoverService.updatePeerDescription(this.peerDescription);
        }
        return true;
      }

      return false;
    });

    return () => {
      stop();
    };
  }
}

interface IPeer {
  name: string;
  version: string;
  ip: string;
  graphqlPort: number;
  nodePort: number;
  address: string;
}
