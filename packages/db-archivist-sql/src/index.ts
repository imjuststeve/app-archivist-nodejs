/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Wednesday, 24th October 2018 10:07:44 am
 * @Email:  developer@xyfindables.com
 * @Filename: index.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Tuesday, 13th November 2018 2:36:37 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { XyoArchivistSqlRepository } from './xyo-archivist-sql-repository';
import { SqlService } from './sql.service';

export default function (options: {
  host?: string | undefined;
  user?: string | undefined;
  password?: string | undefined;
  database?: string | undefined;
  port?: number | undefined;
}) {
  const sqlService = new SqlService(options);
  return new XyoArchivistSqlRepository(sqlService);
}
