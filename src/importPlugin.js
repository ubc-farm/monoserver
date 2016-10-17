import { join, isAbsolute } from 'path';

/* eslint-disable global-require */

export class ConfigError extends Error {
	constructor(key, path) {
		if (key) {
			super(`No path found, check package.json in ${path} for ${key} field`);
		} else {
			super(`No package.json found in ${path}`);
		}
	}
}

/**
 * Searches for a package.json file in the given folder, and the path to the
 * module used is taken from the key path given. The path is relative to the
 * package.json location. Returns the required module.
 * @param {string} key - any . character will be used to find nested properties
 * @param {string} [folder] to search, defaults to process.cwd()
 * @return {*}
 */
export function requireFromConfig(key, folder = process.cwd()) {
	/* eslint-disable import/no-dynamic-require */
	const path = isAbsolute(folder) ? folder : join(process.cwd(), folder);

	let json;
	try {
		json = require(join(path, 'package.json'));
	} catch (err) {
		throw new ConfigError(false, path);
	}

	let pluginPath = key.split('.')
		.reduce((val, prop) => val && prop in val && val[prop], json);
	if (!pluginPath) throw new ConfigError(key, path);
	pluginPath = join(path, pluginPath);

	return require(pluginPath);
}

/**
 * Finds and attaches a plugin to the provided Hapi server.
 * A package.json is search for in the given folder, and the path to the
 * plugin file is taken from that value. That path is relative to the
 * package.json location. Returned promise resolves once plugin has
 * been registered.
 * @param {Hapi.Server} server to register plugin to
 * @param {string} [folder] containg package.json - defaults to process.cwd()
 * @param {Object} [options] passed to server.register
 * @returns {Promise<void>} resolves once plugin has registered.
 */
export default async function importPlugin(server, folder, options) {
	const plugin = requireFromConfig('ubc-farm.server-plugin', folder);
	await server.register(plugin, Object.assign({ once: true }, options));
}
