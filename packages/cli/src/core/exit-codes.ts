/**
 * The exit code for a run that finished with nothing to report.
 *
 * @since 0.3.16-canary.0
 */
export const CLI_EXIT_SUCCESS = 0;
/**
 * The exit code for a run that finished and reported a failure: audit findings, a package that errored, a failed hook.
 *
 * @since 0.16.0
 */
export const CLI_EXIT_FAILURE = 1;
/**
 * The exit code for a run that could not do its job: bad usage or configuration, a missing target, a broken tool.
 *
 * @since 0.16.0
 */
export const CLI_EXIT_ERROR = 2;
