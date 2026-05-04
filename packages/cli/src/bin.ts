#!/usr/bin/env node
import process from "node:process";
import { runCli } from "#/cli";

const code = await runCli(process.argv);
process.exit(code);
