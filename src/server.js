import { join } from 'path';
import { Server } from 'hapi';
import Inert from 'inert';
import Vision from 'vision';
import Handlebars from 'handlebars';

const showDebug = process.env.NODE_ENV === 'development' && ['error'];

export default (async () => {
	const server = new Server({
		connections: {
			routes: {
				cors: true,
				response: {
					emptyStatusCode: 204,
					failAction: 'log',
				},
			},
		},
		debug: { log: showDebug, request: showDebug },
	});

	const port = parseInt(process.env.npm_package_config_port, 10);
	server.connection({
		port: Number.isNaN(port) ? null : port,
	});

	await Promise.all([Inert, Vision].map(plugin => server.register(plugin)));

	await server.views({
		engines: { hbs: Handlebars },
		defaultExtension: 'hbs',
		partialsPath: join(__dirname, '../template-partials'),
		helpersPath: join(__dirname, '../template-helpers'),
		isCached: process.env.NODE_ENV !== 'development',
		allowAbsolutePaths: true,
		context(request) {
			if (request === null) return {};
			const { path, params, query } = request;

			const depth = path.split('/').filter(s => !!s).length;
			const base = depth <= 0 ? '.' : `${'../'.repeat(depth - 1)}..`;

			return { base, params, query, reactRoot: '<div id="reactRoot"></div>' };
		},
	});

	return server;
})();
