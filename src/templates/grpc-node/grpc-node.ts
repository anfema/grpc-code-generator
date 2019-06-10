import { Namespace, NamespaceBase, Root, Service } from 'protobufjs';
import { name } from '.';
import {
	importFileFor,
	importReferenceFor,
	namespacedReferenceForService,
	namespacesOf,
	recursiveServicesOf,
	servicesOf,
} from '../utils';
import { indent, banner } from '../tags';

const serviceImportDeclarations = (root: Root, baseNs: Namespace) =>
	recursiveServicesOf(root).map(
		ns => `import * as ${importReferenceFor(ns)} from '${importFileFor(ns, baseNs)}/grpc-node';`,
	);

function namespaceDeclarations(namespace: NamespaceBase): string {
	const serviceTypes = servicesOf(namespace).map(ns => serviceDeclaration(ns));
	const subNamespaces = namespacesOf(namespace)
		.filter(ns => recursiveServicesOf(ns).length > 0)
		.map(ns => subNamespaceDeclaration(ns));

	return indent`
		${serviceTypes.join('\n')}
		${subNamespaces.join('\n')}
	`;
}

const subNamespaceDeclaration = (ns: Namespace) => indent`
	${ns.name}: {
		${namespaceDeclarations(ns as NamespaceBase)}
	}
`;

const serviceDeclaration = (service: Service) => indent`
	${service.name}: ${namespacedReferenceForService(service)}.ClientConstructor;
`;

export default (root: Root) => indent`
	${banner(name)}
	import { GrpcObject } from 'grpc';
	${serviceImportDeclarations(root, root).join('\n')}

	export default interface Grpc extends GrpcObject {
		${namespaceDeclarations(root)}
	}
`;
