/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Wednesday, 12th December 2018 5:32:43 pm
 * @Email:  developer@xyfindables.com
 * @Filename: xyo-get-blocks-by-public-key-resolver.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 12th December 2018 5:40:50 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { IXyoHashProvider } from '@xyo-network/hashing'
import { IXyoDataResolver } from "../@types"
import { IXyoArchivistRepository } from '@xyo-network/archivist-repository'
import { IXyoSerializationService } from '@xyo-network/serialization'
import { IXyoPublicKey } from '@xyo-network/signing'
import { XyoBase } from '@xyo-network/base'

export class XyoGetBlocksByPublicKeyResolver extends XyoBase implements IXyoDataResolver<any, any, any, any> {

  constructor(
    private readonly archivistRepository: IXyoArchivistRepository,
    protected readonly hashProvider: IXyoHashProvider,
    protected readonly serializationService: IXyoSerializationService
  ) {
    super()
  }

  public async resolve (obj: any, args: any, context: any, info: any): Promise<any> {
    if (!args || !args.publicKeys || !args.publicKeys.length) {
      return []
    }

    const blocks = await Promise.all((args.publicKeys as string[]).map(async (publicKey) => {
      const innerBlocks = await this.getBlockCollectionForPublicKey(publicKey)
      return {
        publicKey,
        publicKeySet: innerBlocks.keySet,
        blocks: innerBlocks.blocks
      }
    }))

    return blocks
  }

  private async getBlockCollectionForPublicKey(publicKey: string) {
    try {
      const blocksByPublicKeySet = await this.archivistRepository.getOriginBlocksByPublicKey(
        this.serializationService.deserialize(Buffer.from(publicKey, 'hex')).hydrate<IXyoPublicKey>()
      )

      const serializedBoundWitnesses = await Promise.all(blocksByPublicKeySet.boundWitnesses.map(async (block) => {
        return {
          publicKeys: block.publicKeys.map((keyset) => {
            return {
              array: keyset.keys.map((key) => {
                return {
                  bytes: key.serializeHex(),
                  rawPublicKey: key.getRawPublicKey().toString('hex'),
                  schemaName: key.getReadableName()
                }
              })
            }
          }),
          signatures: block.signatures.map((sigSet) => {
            return {
              array: sigSet.signatures.map((sig) => {
                return {
                  bytes: sig.serializeHex(),
                  rawSignature: sig.encodedSignature.toString('hex'),
                  schemaName: sig.getReadableName()
                }
              })
            }
          }),
          heuristics: block.heuristics.map((heuristicSet) => {
            return {
              array: heuristicSet.map((heuristic) => {
                return {
                  bytes: heuristic.serializeHex(),
                  schemaName: heuristic.getReadableName(),
                  value: JSON.stringify(heuristic.getReadableValue())
                }
              })
            }
          }),
          signedHash: (await this.hashProvider.createHash(block.getSigningData())).serializeHex()
        }
      }))

      return {
        blocks: serializedBoundWitnesses,
        keySet: blocksByPublicKeySet.publicKeys.map((publicKeyItem) => {
          return publicKeyItem.getRawPublicKey().toString('hex')
        })
      }

    } catch (e) {
      this.logError(`There was an error getting block-collection from public-key`, e)
      return {
        blocks: [],
        keySet: [publicKey]
      }
    }
  }
}
