import fs from 'fs-extra';
import filesize from 'filesize'; // Version 6.x export default function
import gzipSize from 'gzip-size';

interface ReportOptions {
  path: string;
  code: string;
}

export function reportSize({ path: filePath, code }: ReportOptions) {
  const { size } = fs.statSync(filePath);
  const gzipped = gzipSize.sync(code);

  return `| Size: ${filesize(size)} | Gzip: ${filesize(gzipped)}`;
}
