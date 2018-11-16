import { XyoBoundWitness } from '@xyo-network/sdk-core-nodejs';
import { XyoDataResolver } from "../@types";
import { XyoBaseDataResolver } from "../xyo-base-data-resolver";
import { transformKeySet } from "../graphql-transformers";

export class GetPublicKeysFromBlockResolver extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

  public async resolve (obj: any, args: any, context: any, info: any): Promise<any> {
    const blocks = context.blocks as XyoBoundWitness[];
    const block = blocks[0];

    return Promise.all(block.publicKeys.map(async (publicKeySet) => {
      return transformKeySet(publicKeySet, this.hashProvider);
    }));
  }
}
