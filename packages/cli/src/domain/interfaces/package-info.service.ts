/**
 * Interface for retrieving package metadata, such as version.
 */
export interface PackageInfoServiceInterface {
  getPackageVersion: () => string;
}
