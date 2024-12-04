import { createRequire } from 'node:module';
import pkgJson from '../../package.json' assert { type: 'json' };

const require = createRequire(import.meta.url);

/**
 * Logs a message to the standard error stream.
 *
 * @param message - The message to be logged. Defaults to an empty string if not provided.
 * @return A boolean indicating if the message was successfully written to the stream.
 */
function log(message = '') {
  return process.stderr.write(`${message}\n`);
}

/**
 * @returns {string} The name of the package manager.
 */
function readPackageManager() {
  const match = process.env.npm_config_user_agent?.match(/^(?<pm>\w+)\//);
  return match?.groups ? match.groups?.pm : 'npm';
}

/**
 * @param {string} configName
 * @param {string} packageName
 */
export default function checkPeerDependency(configName, packageName) {
  try {
    require.resolve(packageName);
  } catch {
    const packageManager = readPackageManager();
    const command = packageManager === 'yarn' ? 'add' : 'install';

    log(`The \`${configName}\` config requires an optional peer dependency, which has not been installed.`);
    log();
    log('To install it, run:');
    log(`- ${packageManager} ${command} ${packageName}@${pkgJson.peerDependencies[packageName]}`);

    process.exit(1);
  }
}
