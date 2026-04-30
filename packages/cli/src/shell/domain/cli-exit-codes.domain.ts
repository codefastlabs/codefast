/**
 * Process exit codes for the `codefast` CLI.
 *
 * Conventions align with common Unix tooling: `0` success, `1` general failure,
 * `2` for invalid invocation (schema / options), matching GNU `sysexits` `EX_USAGE` spirit.
 */
export const CLI_EXIT_SUCCESS = 0;
export const CLI_EXIT_GENERAL_ERROR = 1;
export const CLI_EXIT_USAGE = 2;
