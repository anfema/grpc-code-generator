#!/usr/bin/env node

import * as process from 'process';
import { cli } from './cli';
import { render, writeFiles } from './';
import { configFromArgs, configFromFile, mergeConfig, defaultConfig } from './config';

(async function() {
	try {
		const config = mergeConfig(configFromArgs(cli), mergeConfig(configFromFile(cli), defaultConfig));
		await writeFiles(await render(config), config.out);

		process.exit(0);
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}
})();
