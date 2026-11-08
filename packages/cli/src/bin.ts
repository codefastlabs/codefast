#!/usr/bin/env node
import process from "node:process";

import { runCli } from "#cli";

// Setting the code instead of calling `process.exit` lets a piped stdout drain before the process ends.
process.exitCode = await runCli(process.argv);
