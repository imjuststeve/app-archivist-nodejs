/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Wednesday, 7th November 2018 2:32:21 pm
 * @Email:  developer@xyfindables.com
 * @Filename: process-manager.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Wednesday, 7th November 2018 2:36:20 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

// tslint:disable:no-console

import { XyoArchivistLauncher } from "./archivist-launcher";

export class ProcessManager {

  public unhandledRejections = new Map();

  constructor (private readonly launcher: XyoArchivistLauncher) {}

  public async manage(process: NodeJS.Process) {
    process.on('beforeExit', (exitCode) => {
      console.log(`Will exit with exitCode ${exitCode}`);
    })
    .on('exit', (exitCode) => {
      console.log(`Exiting with exitCode ${exitCode}`);
    })
    .on('multipleResolves', (type, promise, value) => {
      console.error(`A promise with type ${type} was resolved multiple times with value ${value}. Will exit.`);
      setImmediate(() => process.exit(1));
    })
    .on('unhandledRejection', (reason, promise) => {
      console.error(`There was an unhandled rejection ${reason} ${promise}`);
      this.unhandledRejections.set(promise, reason);
    })
    .on('rejectionHandled', (promise) => {
      console.error(`Reject handled ${promise}`);
      this.unhandledRejections.delete(promise);
    })
    .on('uncaughtException', (err) => {
      console.error(`Uncaught exception. Will exit.\n\n${err.message}\n\n${err.stack}`);
      setImmediate(() => process.exit(1));
    })
    .on('warning', (warning) => {
      console.warn(warning.name);    // Print the warning name
      console.warn(warning.message); // Print the warning message
      if (warning.stack) {
        console.warn(warning.stack);   // Print the stack trace
      }
    })
    .on('SIGINT', async () => {
      if (archivist) {
        console.log(`Shutting down archivist`);
        await archivist.stop();
        console.log(`Archivist shutdown. Will Exit.`);
      }

      process.exit(0);
    });

    const archivist = await this.launcher.start();
    archivist.start();
  }
}
