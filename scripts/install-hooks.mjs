import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const hookDir = join(process.cwd(), '.githooks');
const hookPath = join(hookDir, 'pre-push');

mkdirSync(hookDir, { recursive: true });
writeFileSync(
  hookPath,
  '#!/usr/bin/env sh\nset -eu\nnpm run build:check\n',
  { mode: 0o755 },
);
chmodSync(hookPath, 0o755);

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'ignore' });
} catch {
  // Ignore non-git environments and CI sandboxes that do not need local hooks.
}
