#!/usr/bin/env node

/**
 * CLI Entry Point
 *
 * Main entry point for the CLI application using explicit architecture.
 * Following explicit architecture guidelines for CLI applications.
 */

import "reflect-metadata";

import type { CLIApplication } from "@/presentation/cli-application";

import { configureContainer, getService } from "@/di/container";
import { TYPES } from "@/di/types";

// Configure dependency injection container
configureContainer();

// Get CLI application instance from container
const cliApplication = getService<CLIApplication>(TYPES.CLIApplication);

// Run the CLI application
cliApplication.run();
