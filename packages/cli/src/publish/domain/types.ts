import type { PackageOutcome } from "#core/report";

/**
 * What `publish:prepare` dropped from one package, or would drop on a dry run.
 *
 * @since 0.16.0
 */
export interface PublishPackageOutcome extends PackageOutcome {
  readonly dropped: {
    /** Whether `src` left the `files` list. */
    readonly filesSrc: boolean;
    readonly exportsSource: number;
    readonly importsSource: number;
    readonly importsUnshipped: number;
    readonly scripts: number;
    readonly devDependencies: number;
    readonly sourceMaps: number;
    readonly sourceMappingComments: number;
  };
}

/**
 * The report of a `publish:prepare` run: one outcome per package the target reaches.
 *
 * @since 0.16.0
 */
export interface PublishPrepareReport {
  readonly packages: ReadonlyArray<PublishPackageOutcome>;
}
