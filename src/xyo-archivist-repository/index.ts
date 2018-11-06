/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 24th September 2018 11:23:29 am
 * @Email:  developer@xyfindables.com
 * @Filename: index.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Tuesday, 6th November 2018 2:58:27 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { IXyoOriginBlockRepository, XyoObject, XyoBoundWitness, IXyoPublicKey } from "@xyo-network/sdk-core-nodejs";

/**
 * A persistance abstraction for an XyoArchivist. This interface powers
 * the graphql api
 */
export interface XyoArchivistRepository extends IXyoOriginBlockRepository {

  /**
   * Will return all the origin-blocks for a particular public-key
   * and any other public-keys determined to be equivalent to the public-key passed in
   */
  getOriginBlocksByPublicKey(publicKey: XyoObject): Promise<XyoOriginBlocksByPublicKeyResult>;

  getEntities(limit: number, cursor: string | undefined): Promise<XyoEntitiesList>;
}

export interface XyoEntityType {
  sentinel: boolean;
  bridge: boolean;
  archivist: boolean;
  diviner: boolean;
}

export interface XyoEntity {
  firstKnownPublicKey: string;
  allPublicKeys?: string[];
  type: XyoEntityType;
  mostRecentIndex?: number;
  mostRecentBlockHash?: string;
  mostRecentPublicKeys?: string[];
}

export interface XyoEntitiesList {
  totalSize: number;
  hasNextPage: boolean;
  list: XyoEntity[];
  cursor: string | undefined;
}

export interface XyoOriginBlockResult {
  publicKeys: XyoObject[];
}

export interface XyoOriginBlocksByPublicKeyResult {
  publicKeys: XyoObject[];
  boundWitnesses: XyoBoundWitness[];
}

export interface IXyoAboutMe {
  name: string;
  version?: string;
  ip?: string;
  graphqlPort?: number;
  nodePort?: number;
  address?: string;
  peers?: Array<{ // tslint:disable-line:prefer-array-literal
    name: string;
    version?: string;
    ip?: string;
    graphqlPort?: number;
    nodePort?: number;
    address?: string;
  }>;
}
