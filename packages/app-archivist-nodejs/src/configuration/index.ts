/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Wednesday, 31st October 2018 4:09:15 pm
 * @Email:  developer@xyfindables.com
 * @Filename: configuration.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 15th November 2018 2:31:03 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */
import path from 'path';

/** if its not set, set it to the default */
process.env.NODE_CONFIG_DIR = process.env.NODE_CONFIG_DIR || path.join(__dirname, '..', '..', 'config');

// tslint:disable-next-line:no-console
console.log(`Loading Configuration from ${process.env.NODE_CONFIG_DIR}`);

import config from 'config';

export class XyoArchivistConfig {
  public port = (() => {
    return parseInt(config.get<string>('port'), 10);
  })();

  public graphql = (() => {
    return parseInt(config.get<string>('graphql'), 10);
  })();

  public data = (() => {
    return config.get('data') as string;
  })();

  public nodeName = (() => {
    return config.get('nodeName') as string | undefined;
  })();

  public isPublic = this.coerceBooleanValue('isPublic', false);

  public publicIpOverride = (() => {
    return config.get<string | undefined>('ipOverride');
  })();

  public sql = (() => {
    if (!config.get('sql.host')) {
      return undefined;
    }

    return {
      host: (() => {
        return config.get<string>('sql.host');
      })(),

      port: (() => {
        return config.get<number>('sql.port') || 3306;
      })(),

      user: (() => {
        return config.get<string>('sql.user');
      })(),

      password: (() => {
        return config.get<string>('sql.password');
      })(),

      database: (() => {
        return config.get<string>('sql.database');
      })()
    };
  })();

  public discovery = {
    enable: this.coerceBooleanValue('discovery.enable', false),

    dns: config.get<string|null>('discovery.dns') || undefined,

    bootstrapPeers: (() => {
      // tslint:disable:prefer-array-literal
      const bootstrapPeers = config.get<Array<{ip: string, port: number}> | string>('discovery.bootstrapPeers');
      if (typeof bootstrapPeers === 'string') {
        return bootstrapPeers
          .split(',')
          .map((peerString) => {
            const parts = peerString.split(':');
            return {
              ip: parts[0] as string,
              port: parseInt(parts[1], 10)
            };
          });
      }

      return bootstrapPeers;
    })(),

    defaultPort: config.get<number>('discovery.defaultPort')
  };

  public boundWitness = {
    publicKeyRotationRate: (() => {
      const val = config.get<number | undefined | string>('boundWitness.publicKeyRotationRate');
      if (typeof val === 'undefined') {
        return 0;
      }

      if (typeof val === 'number') {
        return val;
      }

      if (typeof val === 'string') {
        return parseInt(val, 10) || 0;
      }

      return 0;
    })()
  };

  public validation = {
    checkPartyLengths: this.coerceBooleanValue('validation.checkPartyLengths', true),
    checkIndexExists: this.coerceBooleanValue('validation.checkIndexExists', true),
    checkCountOfSignaturesMatchPublicKeysCount: this.coerceBooleanValue(
      'validation.checkCountOfSignaturesMatchPublicKeysCount',
      true
    ),
    validateSignatures: this.coerceBooleanValue('validation.validateSignatures', true),
    validateHash: this.coerceBooleanValue('validation.validateHash', true)
  };

  public dependencies = (() => {
    return config.get<IDependencyConfig>('dependencies');
  })();

  private coerceBooleanValue(configIdentifier: string, defaultValue: boolean) {
    const confValue = config.get<boolean | string>(configIdentifier);
    if (typeof confValue === 'boolean') {
      return confValue;
    }

    if (typeof confValue === 'string') {
      return confValue.toLowerCase() === 'true';
    }

    return defaultValue;
  }
}

export default new XyoArchivistConfig();

export interface IDependencyItemConfig {
  type: 'singleton' | 'factory' | 'resolved-export';
  aliases: string[];
  package: string;
  export: 'string';
  resolver?: boolean;
  dependsOn?: string[];
}

export type validDependencyEntries = 'IXyoHashProvider' | 'IXyoSignerProvider';

export interface IDependencyConfig {
  [s: string]: IDependencyItemConfig;
}
