import { importSchema } from 'graphql-import';
import path from 'path';

export class GraphqlSchemaBuilder {

  public buildSchema() {
    const schemaLocation = path.join(__dirname, 'graphql', 'xyo-block-query.graphql');
    const typeDefs = importSchema(schemaLocation);
    return typeDefs;
  }
}
