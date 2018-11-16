import { XyoBoundWitness } from '@xyo-network/sdk-core-nodejs';
import { XyoDataResolver } from "../@types";
import { XyoBaseDataResolver } from "../xyo-base-data-resolver";
import { transformPayload } from '../graphql-transformers';

export class GetPayloadsFromBlockResolver extends XyoBaseDataResolver implements XyoDataResolver<any, any, any, any> {

  public async resolve (obj: any, args: any, context: any, info: any): Promise<any> {
    const blocks = context.blocks as XyoBoundWitness[];
    const block = blocks[0];

    return Promise.all(block.payloads.map(async (payload) => {
      return transformPayload(payload, this.hashProvider);
    }));
  }
}
