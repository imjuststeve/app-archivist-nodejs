/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Friday, 14th December 2018 4:26:55 pm
 * @Email:  developer@xyfindables.com
 * @Filename: index.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Monday, 17th December 2018 11:30:46 am
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import {
  XyoBoundWitness,
  XyoKeySet,
  XyoFetter,
  XyoSignatureSet,
  XyoWitness,
  IXyoBoundWitness
} from '@xyo-network/bound-witness'

import { getSignerProvider } from '@xyo-network/signing.ecdsa'
import { XyoError, XyoErrors } from '@xyo-network/errors'

import yargs, { Arguments } from 'yargs'
import { IXyoSigner } from '@xyo-network/signing'
import { schema } from '@xyo-network/serialization-schema'
import { IXyoSerializableObject, XyoBaseSerializable } from '@xyo-network/serialization'
import { rssiSerializationProvider } from '@xyo-network/heuristics-common'
import { IXyoHash, getHashingProvider } from '@xyo-network/hashing'
import { XyoIndex, XyoPreviousHash } from '@xyo-network/origin-chain'
import { createArchivistSqlRepository } from '@xyo-network/archivist-repository.sql'

const dataSet: IXyoInteraction[] = [
  {
    party1: 1,
    party2: 2,
    party1Heuristics: {
      rssi: -10
    },
    party2Heuristics: {
      rssi: -15
    }
  }
]

async function main(args: Arguments) {
  const numberOfPublicKeys = args.numberOfPublicKeys
  const entitiesById = createPublicKeys(numberOfPublicKeys)
  const hashingProvider = getHashingProvider('sha256')

  const boundWitnesses = await dataSet.reduce(async (interactionsPromise, interaction, index) => {
    const interactions = await interactionsPromise
    const serverEntity = entitiesById[interaction.party1]
    if (!serverEntity) {
      throw new XyoError(`Could not get signers for party index ${index}`, XyoErrors.CRITICAL)
    }

    const clientEntity = entitiesById[interaction.party2]
    if (!clientEntity) {
      throw new XyoError(`Could not get signers for party index ${index}`, XyoErrors.CRITICAL)
    }

    const serverKeySet = new XyoKeySet([serverEntity.signer.publicKey])
    const clientKeySet = new XyoKeySet([clientEntity.signer.publicKey])
    const serverHeuristics = tryBuildHeuristics(
      interaction.party1Heuristics,
      serverEntity.index,
      serverEntity.previousHash
    )

    const clientHeuristics = tryBuildHeuristics(
      interaction.party2Heuristics,
      serverEntity.index,
      serverEntity.previousHash
    )
    const serverFetter = new XyoFetter(serverKeySet, serverHeuristics)
    const clientFetter = new XyoFetter(clientKeySet, clientHeuristics)
    const signingData = Buffer.concat([
      serverFetter.serialize(),
      clientFetter.serialize(),
    ])

    const serverSignature = await entitiesById[interaction.party1].signer.signData(signingData)
    const clientSignature = await entitiesById[interaction.party2].signer.signData(signingData)
    const serverWitness = new XyoWitness(new XyoSignatureSet([serverSignature]), [])
    const clientWitness = new XyoWitness(new XyoSignatureSet([clientSignature]), [])
    const boundWitness = new XyoBoundWitness([serverFetter, clientFetter, clientWitness, serverWitness])

    interactions.push(boundWitness)
    serverEntity.index = (serverEntity.index || 0) + 1
    clientEntity.index = (clientEntity.index || 0) + 1
    const hash = await hashingProvider.createHash(signingData)
    serverEntity.previousHash = hash
    clientEntity.previousHash = hash

    serverEntity.originChain = serverEntity.originChain || []
    serverEntity.originChain.push(boundWitness)

    clientEntity.originChain = clientEntity.originChain || []
    clientEntity.originChain.push(boundWitness)
    return interactions
  }, Promise.resolve([]) as Promise<IXyoBoundWitness[]>)

  const repo = createArchivistSqlRepository({
    host: args.host,
    user: args.user,
    password: args.password
    database: args.database,
    port: args.port
  })
}

function tryBuildHeuristics(
  heuristics: IXyoHeuristics,
  index?: number,
  previousHash?: IXyoHash
): IXyoSerializableObject[] {
  const heuristicsCollection: IXyoSerializableObject[] = []
  if (index !== undefined) {
    heuristicsCollection.push(new XyoIndex(index))
  }

  if (previousHash !== undefined) {
    heuristicsCollection.push(new XyoPreviousHash(previousHash))
  }

  return Object.keys(heuristics)
    .reduce((memo: IXyoSerializableObject[], key) => {
      const def = schema[key]
      const val = heuristics[key]
      if (def) {
        switch (def.id) {
          case schema.rssi.id:
            memo.push(rssiSerializationProvider.newInstance(val as number))
            return memo
        }
      }

      const serializable = new XyoKeyValueSerializable(key, val)
      memo.push(serializable)
      return memo
    }, heuristicsCollection)
}

function createPublicKeys(numberOfPublicKeys: number): IXyoEntityById {
  const signerProvider = getSignerProvider('secp256k1-sha256')
  const signersById: {[s: string]: { signer: IXyoSigner}} = {}
  let i = 0
  while (i < numberOfPublicKeys) {
    signersById[i] = { signer: signerProvider.newInstance() }
    i += 1
  }

  return signersById
}

if (require.main === module) {
  main(yargs.argv)
}

interface IXyoEntityById {
  [s: string]: IEntity
}

interface IEntity {
  signer: IXyoSigner
  index?: number
  previousHash?: IXyoHash,
  originChain?: IXyoBoundWitness[]
}

interface IXyoHeuristics {[s: string]: any}

interface IXyoInteraction {
  party1: number
  party2: number
  party1Heuristics: IXyoHeuristics,
  party2Heuristics: IXyoHeuristics
}

class XyoKeyValueSerializable extends XyoBaseSerializable implements IXyoSerializableObject {

  public schemaObjectId = 0xFF

  constructor(private readonly readableName: string, private readonly readableValue: any) {
    super(schema)
  }

  public getReadableValue() {
    return {
      [this.readableName]: this.readableValue
    }
  }

  public getReadableName() {
    return this.readableName
  }

  public getData(): Buffer | IXyoSerializableObject | IXyoSerializableObject[] {
    const value = JSON.stringify(this.getReadableValue())
    return Buffer.from(value)
  }
}
