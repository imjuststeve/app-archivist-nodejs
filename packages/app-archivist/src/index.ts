/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Wednesday, 21st November 2018 11:39:13 am
 * @Email:  developer@xyfindables.com
 * @Filename: index.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 13th December 2018 1:37:36 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoBaseNode } from '@xyo-network/base-node'
import { createArchivistSqlRepository } from '@xyo-network/archivist-repository.sql'
import createGraphqlServer from '@xyo-network/api-archivist-graphql'
import { XyoAboutMeService } from '@xyo-network/about-me'
import { XyoIpService } from '@xyo-network/ip-service'
import { IXyoArchivistRepository } from '@xyo-network/archivist-repository'
import { XyoPeerDiscoveryService } from '@xyo-network/peer-discovery'
import { XyoBoundWitness, XyoFetter, XyoWitness, XyoKeySet, XyoSignatureSet } from '@xyo-network/bound-witness'
import { XyoIndex, XyoOriginChainLocalStorageRepository, IXyoOriginChainRepository } from '@xyo-network/origin-chain'
import { createDirectoryIfNotExists } from './utils'
import { XyoLevelDbStorageProvider } from '@xyo-network/storage.leveldb'
import configuration from './configuration'
import { XyoError, XyoErrors } from '@xyo-network/errors'
import { ProcessManager } from './process-manager'
import { GraphQLServer } from '../../api-archivist-graphql/dist/server'

export class XyoArchivistNode extends XyoBaseNode {
  private readonly config = configuration
  private server: GraphQLServer | undefined

  public async start() {
    super.start()
    const serializationService = this.getSerializationService()
    await createDirectoryIfNotExists(this.config.data)
    await this.configureOriginChainStateRepository()
    const aboutMeService = await this.getAboutMeService()
    if (this.config.discovery.enable) {
      aboutMeService.startDiscoveringPeers()
    }

    this.server = await createGraphqlServer(
      11001,
      aboutMeService,
      this.getOriginBlockRepository(),
      this.getHashingProvider(),
      serializationService
    )

    this.server.start()
  }

  public async stop() {
    const success = await super.stop()
    if (this.server) {
      await this.server.stop()
      return success
    }

    return false
  }

  protected getNodePort(): number {
    return this.config.port || 11000
  }

  protected async getAboutMeService(): Promise<XyoAboutMeService> {
    const genesisSigner = await this.getOriginStateRepository().getGenesisSigner()
    if (!genesisSigner) {
      throw new XyoError(`Could not start about-me service without genesis signer`, XyoErrors.CRITICAL)
    }

    return this.getOrCreate('XyoAboutMeService', () => {
      return new XyoAboutMeService(
        this.getIpService(),
        this.config.nodeVersion || 'unspecified',
        this.config.isPublic,
        genesisSigner.publicKey,
        this.getPeerDiscoveryService(),
        {
          name: this.config.nodeName,
          publicIpOverride: this.config.publicIpOverride
        }
      )
    })
  }

  protected getPeerDiscoveryService(): XyoPeerDiscoveryService {
    return this.getOrCreate('XyoPeerDiscoveryService', () => {
      return new XyoPeerDiscoveryService(
        this.config.discovery.bootstrapPeers,
        this.config.discovery.dns,
        this.config.discovery.defaultPort
      )
    })
  }

  protected getIpService(): XyoIpService {
    return this.getOrCreate('XyoIpService', () => {
      return new XyoIpService(this.config.graphql, this.config.port)
    })
  }

  protected getOriginBlockRepository(): IXyoArchivistRepository {
    return this.getOrCreate('IXyoOriginBlockRepository', () => {
      if (!this.config.sql) {
        throw new XyoError(`SQL configuration required`, XyoErrors.CRITICAL)
      }

      return createArchivistSqlRepository({
        host: this.config.sql.host,
        database: this.config.sql.database,
        password: this.config.sql.password,
        user: this.config.sql.user,
        port: this.config.sql.port
      }, this.getSerializationService())
    })
  }

  protected getBoundWitnessValidatorSettings() {
    return this.config.validation
  }

  protected getOriginStateRepository(): IXyoOriginChainRepository {
    return this.getOrCreate('IXyoOriginChainRepository', () => {
      const db = XyoLevelDbStorageProvider.createStore(this.config.data)
      return new XyoOriginChainLocalStorageRepository(db, this.getSerializationService())
    })
  }

  private async configureOriginChainStateRepository() {
    const originChainStateRepository = this.getOriginStateRepository()

    if ((await originChainStateRepository.getSigners()).length === 0) {
      const signers = this.getSigners()
      await originChainStateRepository.setCurrentSigners(signers)
    }

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
  const processManager = new ProcessManager(archivistNode)
  processManager.manage(process)
}
