import { makeExecutableSchema } from 'graphql-tools'
import { requireFromConfig } from './importPlugin.js';
import globAll from './globAll.js';

/**
 * Forces a glob pattern to look for directories rather than files.
 * If a pattern ends with a `/`, then glob will only return folders.
 * @param {string} pattern passed to glob
 * @returns {string} pattern for folders
 */
function forceDirectory(pattern) {
	return pattern.endsWith('/') ? pattern : `${pattern}/`;
}

/**
 * @param {Hapi.Server|Promise<Hapi.Server>} server - can be
 * either a Hapi server or a promise that resolves with one
 * @param {string[]} patterns to search in glob format
 */
export default async function searchSchemas(patterns) {
	let folders;

	if (!Array.isArray(patterns) || patterns.length === 0) {
		folders = [process.cwd()];
	} else {
		const dirPatterns = patterns.map(forceDirectory);
		folders = await globAll(dirPatterns);
	}

	const schemas = await Promise.all(
		folders.map(folder => requireFromConfig('ubc-farm.graphql', folder))
	);

	return makeExecutableSchema({
		typeDefs: [schemas],
	});
}
