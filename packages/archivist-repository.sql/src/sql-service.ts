/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Monday, 3rd December 2018 1:18:49 pm
 * @Email:  developer@xyfindables.com
 * @Filename: sql-service.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Thursday, 13th December 2018 5:28:04 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { default as mysql, Connection, MysqlError } from 'mysql'
import { XyoBase } from '@xyo-network/base'
import fs from 'fs'
import { ISqlConnectionDetails } from './@types'

export class SqlService extends XyoBase {
  public static tryCreateSqlService = tryCreateSqlService
  private connection: Connection | undefined

  constructor(private readonly options: {
    host?: string,
    user?: string,
    password?: string,
    database?: string,
    port?: number,
    connection?: any,
    multipleStatements?: boolean
  }) {
    super()
  }

  public async query<T>(q: string, substitutions?: any[]): Promise<T> {
    const c = await this.getOrCreateConnection()
    return this.queryConnection<T>(c, q, substitutions)
  }

  public async startTransaction(): Promise<ISqlTransaction> {
    const connection = await this.getOrCreateConnection()
    this.connection = undefined // Set to undefined so queries come in it grabs a new connection

    return new Promise((resolve, reject) => {
      connection.beginTransaction(() => {
        const rollback = (): Promise<void> => {
          this.logInfo(`Rolling back transaction`)
          return new Promise((res, rej) => {
            connection.rollback((err) => {
              this.logInfo(`Callback for rollback called with value ${err}`)
            })
            res()
          })
        }

        const commit = (): Promise<void> => {
          return new Promise((res, rej) => {
            connection.commit(async (err) => {
              this.logInfo(`Callback for commit called`)
              if (err) {
                await rollback()
                rej(err)
              }
              res()
            })

          })
        }
        return resolve({
          rollback,
          commit,
          sqlService: new SqlService({ connection }),
        })
      })
    }) as Promise<ISqlTransaction>
  }

  public stop(): Promise<void> {
    return this.endConnection()
  }

  private async getOrCreateConnection(maxTries: number = 5, tryNumber: number = 1): Promise<Connection> {
    if (this.connection) {
      return this.connection
    }

    this.logInfo(`Trying to get connection. Try number ${tryNumber} of ${maxTries}`)
    const c = mysql.createConnection(this.options)

    const createdConnection = await (new Promise((resolve, reject) => {
      c.connect((err: Error | undefined) => {
        if (err) {
          this.logInfo(`Failed get connection. Try number ${tryNumber} of ${maxTries}`)
          if (tryNumber === maxTries) {
            return reject(err)
          }

          return setTimeout(() => {
            return this.getOrCreateConnection(maxTries, tryNumber + 1).then(resolve).catch(reject)
          }, 1000 * Math.pow(2, tryNumber)) // exponential backoff
        }

        this.connection = c
        return resolve(this.connection)
      })
    }) as Promise<Connection>)

    await this.queryConnection(createdConnection, `SET SQL_MODE="NO_ENGINE_SUBSTITUTION";`)
    return createdConnection
  }

  private async queryConnection<T>(c: Connection, q: string, substitutions?: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      const callback = (error: MysqlError | null, results: T) => {
        if (error) {
          return reject(error)
        }

        return resolve(results)
      }

      const query = substitutions ? c.query(q, substitutions, callback) : c.query(q, callback)
      this.logInfo(query.sql)
    }) as Promise<T>
  }

  private async endConnection(): Promise<void> {
    if (this.connection) {
      const c = this.connection
      this.connection = undefined

      return new Promise((resolve, reject) => {
        c.end((err: Error | undefined) => {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      }) as Promise<void>
    }
  }
}

interface ISqlTransaction {
  sqlService: SqlService

  commit(): Promise<void>
  rollback(): Promise<void>
}

async function tryCreateSqlService(
  connectionDetails: ISqlConnectionDetails,
  schemaPath?: string
) {
  const sqlService = new SqlService(connectionDetails)
  try {

    // This will timeout if it does not exist with a `ER_BAD_DB_ERROR`
    await sqlService.query<any[]>(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [connectionDetails.database]
    )

    return sqlService
  } catch (err) {
    if (err.code === 'ER_BAD_DB_ERROR' && schemaPath) {
      const tmpSqlService = new SqlService({
        host: connectionDetails.host,
        user: connectionDetails.user,
        password: connectionDetails.password,
        port: connectionDetails.port,
        multipleStatements: true
      })
      const schema = fs.readFileSync(schemaPath)
      await tmpSqlService.query(`
        CREATE SCHEMA IF NOT EXISTS \`${connectionDetails.database}\` DEFAULT CHARACTER SET utf8 ;
        USE \`${connectionDetails.database}\`;
        ${schema}
      `, [])
      return sqlService
    }

    XyoBase.logger.error(`There was an error creating the sql service`, err)
    throw err
  }
}
