#!/usr/bin/env node
import process from "node:process";
import { runCli } from "#program";

const code = await runCli(process.argv);
process.exit(code);
