/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Wednesday, 21st November 2018 11:39:13 am
 * @Email:  developer@xyfindables.com
 * @Filename: index.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 12th December 2018 5:42:12 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoBaseNode } from '@xyo-network/base-node'
import { createArchivistSqlRepository } from '@xyo-network/archivist-repository.sql'
import initializeGraphqlApi from '@xyo-network/api-archivist-graphql'
import { XyoAboutMeService } from '@xyo-network/about-me'
import { XyoIpService } from '@xyo-network/ip-service'
import { IXyoArchivistRepository } from '@xyo-network/archivist-repository'
import { XyoPeerDiscoveryService } from '@xyo-network/peer-discovery'
import { XyoBoundWitness, XyoFetter, XyoWitness, XyoKeySet, XyoSignatureSet } from '@xyo-network/bound-witness'
import { XyoIndex } from '@xyo-network/origin-chain'

export class XyoArchivistNode extends XyoBaseNode {

  public async start() {
    super.start()
    const serializationService = this.getSerializationService()
    await this.configureOriginChainStateRepository()
    const aboutMeService = await this.getAboutMeService()
    initializeGraphqlApi(
      11001,
      aboutMeService,
      this.getOriginBlockRepository(),
      this.getHashingProvider(),
      serializationService
    )
  }

  protected async getAboutMeService(): Promise<XyoAboutMeService> {
    const genesisSigner = await this.getOriginStateRepository().getGenesisSigner()
    return this.getOrCreate('XyoAboutMeService', () => {
      return new XyoAboutMeService(
        this.getIpService(),
        '0.8.0',
        true,
        genesisSigner!.publicKey,
        this.getPeerDiscoveryService(),
        {
          name: `Ryan's Archivist`,
          publicIpOverride: '10.30.10.253'
        }
      )
    })
  }

  protected getPeerDiscoveryService(): XyoPeerDiscoveryService {
    return this.getOrCreate('XyoPeerDiscoveryService', () => {
      return new XyoPeerDiscoveryService([], 'peers.xyo.network', 11001)
    })
  }

  protected getIpService(): XyoIpService {
    return this.getOrCreate('XyoIpService', () => {
      return new XyoIpService(11001, 11000)
    })
  }

  protected getOriginBlockRepository(): IXyoArchivistRepository {
    return this.getOrCreate('IXyoOriginBlockRepository', () => {
      this.logInfo(`SQL archivist loaded`)
      return createArchivistSqlRepository({
        host: '127.0.0.1',
        database: 'Xyo',
        password: 'password',
        user: 'ryan',
        port: 3306
      }, this.getSerializationService())
    })
  }

  private async configureOriginChainStateRepository() {
    const originChainStateRepository = this.getOriginStateRepository()

    const currentIndex = await originChainStateRepository.getIndex()

    if (currentIndex === 0) { // create genesis block
      this.logInfo(`Creating genesis block`)
      const signers = await originChainStateRepository.getSigners()

      const fetter = new XyoFetter(new XyoKeySet(signers.map(signer => signer.publicKey)), [new XyoIndex(0)])
      const signingData = fetter.serialize()
      const signatures = await Promise.all(signers.map(signer => signer.signData(signingData)))
      const genesisBlock = new XyoBoundWitness([
        fetter,
        new XyoWitness(new XyoSignatureSet(signatures), [])
      ])

      const hash = await this.getHashingProvider().createHash(signingData)
      await this.getOriginBlockRepository().addOriginBlock(hash, genesisBlock)
      await this.getOriginStateRepository().updateOriginChainState(hash)

      this.logInfo(`Add genesis block with hash ${hash.serializeHex()}`)
    }
  }
}

if (require.main === module) {
  const archivistNode = new XyoArchivistNode()
  archivistNode.start()
}
