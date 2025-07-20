#!/usr/bin/env node

/**
 * CLI Entry Point
 *
 * Main entry point for the CLI application using explicit architecture.
 * Following explicit architecture guidelines for CLI applications.
 */

import "reflect-metadata";

import type { CommandHandler } from "@/commands/command-handler";

import { configureContainer, getService } from "@/di/container";
import { TYPES } from "@/di/types";

// Configure dependency injection container
configureContainer();

// Get command handler instance from container
const commandHandler = getService<CommandHandler>(TYPES.CommandHandler);

// Run the command handler
commandHandler.run();
