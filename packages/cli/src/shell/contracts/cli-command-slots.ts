/**
 * Stable DI slot names for `CliCommandToken` multi-bindings and Commander subcommand names.
 * Keep in sync with `CliCommand.definition.name` on each command class.
 */
export const CLI_COMMAND_SLOT_NAME = {
  arrange: "arrange",
  mirror: "mirror",
  tag: "tag",
} as const;
