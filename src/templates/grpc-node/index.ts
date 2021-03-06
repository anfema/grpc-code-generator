import * as path from 'path';
import { Root, Service } from 'protobufjs';
import { RenderedTemplatesMap } from '../..';
import { parentChainOf, recursiveServicesOf } from '../utils';
import grpcNode from './grpc-node';
import serviceDeclaration from './service';

export const name = 'grpc-node';

export default function(root: Root): RenderedTemplatesMap {
	const templates = new Map<string, string>();

	templates.set('grpc-node.d.ts', grpcNode(root));

	recursiveServicesOf(root).forEach(service => {
		templates.set(fileNameForService(service), serviceDeclaration(service, root));
	});

	return templates;
}

const fileNameForService = (service: Service) =>
	path.join(
		...[...parentChainOf(service), service]
			.slice(1) // omit the root namespace
			.map(p => p.name),
		'grpc-node.d.ts',
	);
