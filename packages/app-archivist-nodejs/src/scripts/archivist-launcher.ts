import {
  XyoOriginChainLocalStorageRepository,
  XyoOriginBlockLocalStorageRepository,
  IXyoBoundWitnessSuccessListener,
  IXyoHashProvider,
  XyoBase,
  IXyoOriginChainStateRepository,
  IXyoOriginBlockRepository,
  XyoError,
  XyoErrors,
  IXyoStorageProvider,
  XyoIpService,
  XyoGenesisBoundWitness,
  XyoKvDb,
  XyoPeerDiscoveryService,
  XyoOriginBlockValidator,
  IXyoSignerProvider,
  createPayload
} from '@xyo-network/sdk-core-nodejs';

import { XyoArchivist } from '../nodes/xyo-archivist';
import { createDirectoryIfNotExists } from '../utils/file-system-utils';
import { default as config, XyoArchivistConfig } from '../configuration';

import { getLevelDbStore } from '../utils/leveldb-storage-provider-store';
import { XyoSimpleBoundWitnessSuccessListener } from '../utils/xyo-simple-bound-witness-success-listener';

import serverInitializer from '@xyo-network/api-archivist-graphql';

import {
  XyoArchivistLocalStorageRepository,
  XyoAboutMeService,
  XyoArchivistRepository
} from '@xyo-network/sdk-archivist-nodejs';

import xyoSqlArchivistInitializer from '@xyo-network/db-archivist-sql';
import { XyoLevelDbStorageProvider } from '../leveldb-storage-provider/level-db-storage-provider';
import { ProcessManager } from './process-manager';
import { XyoDependencyInjectionContainer } from '../di/dependency-injection-container';

export class XyoArchivistLauncher extends XyoBase {

  public static async main() {
    const archivistLauncher = new XyoArchivistLauncher(
      config,
      new XyoDependencyInjectionContainer(config)
    );
    new ProcessManager(archivistLauncher).manage(process);
  }

  public originChainStateRepository!: IXyoOriginChainStateRepository;
  public originBlockRepository!: IXyoOriginBlockRepository;
  public boundWitnessSuccessListener!: IXyoBoundWitnessSuccessListener;
  public archivist!: XyoArchivist;
  public archivistRepository!: XyoArchivistRepository;
  public aboutMeService!: XyoAboutMeService;

  public keyValueStore: IXyoStorageProvider | undefined;
  public hashProvider!: IXyoHashProvider;
  public signerProvider!: IXyoSignerProvider;

  constructor(
    private readonly archivistConfig: XyoArchivistConfig,
    private readonly dependencyInjectionContainer: XyoDependencyInjectionContainer
  ) {
    super();
  }

  public async start() {
    await this.initializeHashingAndSigningServices();
    // If SQL Configuration provided, initialize it
    this.tryInitializeSqlArchivistRepository();

    // Initialize LevelDB data-stores
    await this.tryInitializeLocalDataStores();

    // Throw error if initialization conditions failed
    this.assertValidProgramConditions();

    // Initialize Origin Chain State
    await this.configureOriginChainStateRepository();

    // Discovery and about me services
    await this.initializeAboutMeServices();

    // Finish initialization
    await this.initializeArchivist();

    return this.archivist;
  }

  private async initializeHashingAndSigningServices() {
    this.hashProvider = await this.dependencyInjectionContainer.get<IXyoHashProvider>(`IXyoHashProvider`);
    this.logInfo(`HashProvider ${this.hashProvider.constructor.name}`);

    this.signerProvider = await this.dependencyInjectionContainer.get<IXyoSignerProvider>(`IXyoSignerProvider`);
    this.logInfo(`SignerProvider ${this.signerProvider.constructor.name}`);
  }

  private async initializeArchivist() {
    this.boundWitnessSuccessListener = new XyoSimpleBoundWitnessSuccessListener(
      this.hashProvider,
      this.originChainStateRepository,
      this.archivistConfig.boundWitness.publicKeyRotationRate,
      this.signerProvider
    );

    this.archivist = new XyoArchivist(
      this.archivistConfig.port,
      this.hashProvider,
      this.originChainStateRepository,
      this.archivistRepository,
      this.boundWitnessSuccessListener,
      new XyoOriginBlockValidator(this.archivistConfig.validation)
    );

    await serverInitializer(
      this.archivistConfig.graphql,
      this.aboutMeService,
      this.archivistRepository,
      this.hashProvider
    );
  }

  private async initializeAboutMeServices() {
    const ipService = new XyoIpService(this.archivistConfig.graphql, this.archivistConfig.port);

    let name = this.archivistConfig.nodeName;
    if (!name) {
      name = (await ipService.getMyIp()).macAddress;
    }

    const genesisSigner = await this.originChainStateRepository.getGenesisSigner();
    if (!genesisSigner) {
      throw new XyoError(`Could not resolve a genesis signer`, XyoErrors.CRITICAL);
    }

    const discoveryService = new XyoPeerDiscoveryService(
      this.archivistConfig.discovery.bootstrapPeers,
      this.archivistConfig.discovery.dns,
      this.archivistConfig.discovery.defaultPort
    );

    const aboutMeService = new XyoAboutMeService(
      ipService,
      '0.1.0-beta',
      this.archivistConfig.isPublic || false,
      genesisSigner.publicKey,
      discoveryService, {
        name,
        publicIpOverride: this.archivistConfig.publicIpOverride
      }
    );

    // Seed `me` value meh
    await aboutMeService.getAboutMe();

    if (this.archivistConfig.discovery.enable) {
      aboutMeService.startDiscoveringPeers();
    }

    this.aboutMeService = aboutMeService;
  }

  private async configureOriginChainStateRepository() {
    if ((await this.originChainStateRepository.getSigners()).length === 0) {
      const signers = [this.signerProvider.newInstance()];
      await this.originChainStateRepository.setCurrentSigners(signers);
    }

    if (this.archivistConfig.boundWitness.publicKeyRotationRate === 1 &&
      (await this.originChainStateRepository.getIndex()).number === 0 &&
      !(await this.originChainStateRepository.getNextPublicKey())) {
      await this.originChainStateRepository.addSigner(this.signerProvider.newInstance());
    }

    const currentIndex = await this.originChainStateRepository.getIndex();

    if (currentIndex.number === 0) { // create genesis block
      this.logInfo(`Creating genesis block`);
      const signers = await this.originChainStateRepository.getSigners();

      const payload = createPayload([currentIndex], []);

      const genesisBlock = new XyoGenesisBoundWitness(signers, payload);
      await genesisBlock.createGenesisBlock();

      const hash = await genesisBlock.getHash(this.hashProvider);
      await this.archivistRepository.addOriginBlock(hash, genesisBlock);
      await this.originChainStateRepository.updateOriginChainState(hash);

      this.logInfo(`Add genesis block with hash ${hash.serialize(true).toString('hex')}`);
    }
  }

  private assertValidProgramConditions() {
    if (!this.hashProvider) {
      throw new XyoError(`Could not resolve HashProvider`, XyoErrors.INVALID_PARAMETERS);
    }

    if (!this.signerProvider) {
      throw new XyoError(`Could not resolve SignerProvider`, XyoErrors.INVALID_PARAMETERS);
    }

    if (!this.originChainStateRepository) {
      throw new XyoError(`Could not resolve OriginChainStateRepository`, XyoErrors.INVALID_PARAMETERS);
    }

    if (!this.archivistRepository && !this.originBlockRepository) {
      throw new XyoError(`Could not resolve OriginBlockRepository`, XyoErrors.INVALID_PARAMETERS);
    }

    if (!this.archivistRepository) {
      throw new XyoError(`Could not resolve Archivist Repository`, XyoErrors.INVALID_PARAMETERS);
    }
  }

  private async tryInitializeLocalDataStores() {
    if (!this.archivistConfig.data) {
      return;
    }

    const getOrCreateLevelDb = (() => {
      let db: XyoLevelDbStorageProvider | undefined;
      let keyValueDatabase: XyoKvDb | undefined;
      return async () => {
        if (db && keyValueDatabase) {
          return keyValueDatabase;
        }
        await createDirectoryIfNotExists(this.archivistConfig.data);
        db = getLevelDbStore(this.archivistConfig.data);
        keyValueDatabase = new XyoKvDb(db);
        return keyValueDatabase;
      };
    })();

    if (!this.originChainStateRepository) {
      const keyValueDatabase = await getOrCreateLevelDb();
      const originChainStorageProvider = await keyValueDatabase.getOrCreateNamespace(`origin-chain`);
      this.originChainStateRepository = new XyoOriginChainLocalStorageRepository(originChainStorageProvider);
    }

    if (!this.archivistRepository && !this.originBlockRepository) {
      const keyValueDatabase = await getOrCreateLevelDb();
      const originBlocksStorageProvider = await keyValueDatabase.getOrCreateNamespace(`origin-blocks`);
      const originBlockNextHashStorageProvider = await keyValueDatabase.getOrCreateNamespace(`next-hash-index`);
      this.originBlockRepository = new XyoOriginBlockLocalStorageRepository(
        originBlocksStorageProvider,
        originBlockNextHashStorageProvider
      );
    }

    if (!this.archivistRepository && !this.keyValueStore) {
      const keyValueDatabase = await getOrCreateLevelDb();
      this.keyValueStore = await keyValueDatabase.getOrCreateNamespace('public-key-index');
    }

    if (!this.archivistRepository && this.originBlockRepository && this.keyValueStore) {
      this.archivistRepository = new XyoArchivistLocalStorageRepository(
        this.originBlockRepository,
        this.keyValueStore
      );
    }
  }

  private tryInitializeSqlArchivistRepository() {
    if (this.archivistConfig.sql &&
      this.archivistConfig.sql.database &&
      this.archivistConfig.sql.host &&
      this.archivistConfig.sql.user &&
      this.archivistConfig.sql.port &&
      this.archivistConfig.sql.password) {
      this.archivistRepository = xyoSqlArchivistInitializer({
        host: this.archivistConfig.sql.host,
        user: this.archivistConfig.sql.user,
        port: this.archivistConfig.sql.port,
        password: this.archivistConfig.sql.password,
        database: this.archivistConfig.sql.database
      });
    }
  }
}

if (require.main === module) {
  XyoArchivistLauncher.main();
}
