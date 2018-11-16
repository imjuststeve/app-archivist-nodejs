import { XyoBoundWitness } from '@xyo-network/sdk-core-nodejs';
import { XyoDataResolver } from "../@types";
import { XyoBaseDataResolver } from "../xyo-base-data-resolver";
import { transformSignatureSet } from "../graphql-transformers";

export class GetSignaturesFromBlockResolver extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

  public async resolve (obj: any, args: any, context: any, info: any): Promise<any> {
    const blocks = context.blocks as XyoBoundWitness[];
    const block = blocks[0];

    return Promise.all(block.signatures.map(async (signatureSet) => {
      return transformSignatureSet(signatureSet, this.hashProvider);
    }));
  }
}
