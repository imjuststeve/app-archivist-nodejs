/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Thursday, 29th November 2018 5:27:14 pm
 * @Email:  developer@xyfindables.com
 * @Filename: index.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Tuesday, 11th December 2018 4:39:08 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoArchivistSqlRepository } from "./xyo-sql-archivist-repository"
import { IXyoSerializationService } from "@xyo-network/serialization"
import { SqlService } from "./sql-service"

export function createArchivistSqlRepository(
  connectionDetails: ISqlConnectionDetails,
  serializationService: IXyoSerializationService
) {
  const sqlService = new SqlService(connectionDetails)
  return new XyoArchivistSqlRepository(sqlService, serializationService)
}

export interface ISqlConnectionDetails {
  host: string,
  user: string,
  password: string,
  database: string,
  port: number
}
