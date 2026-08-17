#!/usr/bin/env node
import { main } from '../src/cli.js';

main().catch((err) => {
  console.error(`✗ ${err?.message || err}`);
  process.exitCode = 1;
});
