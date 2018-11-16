/*
 * @Author: XY | The Findables Company <ryanxyo>
 * @Date:   Friday, 28th September 2018 12:09:35 pm
 * @Email:  developer@xyfindables.com
 * @Filename: file-system-utils.ts
 * @Last modified by: ryanxyo
 * @Last modified time: Friday, 28th September 2018 12:12:16 pm
 * @License: All Rights Reserved
 * @Copyright: Copyright XY | The Findables Company
 */

import { promisify } from "util";
import fs from 'fs';

const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);

export async function createDirectoryIfNotExists(path: string) {
  try {
    await stat(path);
  } catch (err) {
    if (err.code && err.code === 'ENOENT') {
      await mkdir(path, null);
    }
  }
}
