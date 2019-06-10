import { NamespaceBase, Root } from 'protobufjs';
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

export default (root: Root) => {
	const imports = recursiveServicesOf(root);
	const namespaces = namespaceDeclarations(root);

	return indent`
		${banner(name)}

		import { GrpcObject } from 'grpc';
		${imports.map(ns => `import * as ${importReferenceFor(ns)} from '${importFileFor(ns, root)}/grpc-node'`).join('\n')}

		export default interface Grpc extends GrpcObject {
			${namespaces}
		}
	`;
};

function namespaceDeclarations(namespace: NamespaceBase): string {
	return indent`
		${servicesOf(namespace).map(s => indent`
			${s.name}: ${namespacedReferenceForService(s)}.ClientConstructor;
		`).join('\n')}
		${namespacesOf(namespace).filter(ns => recursiveServicesOf(ns).length > 0).map(ns => indent`
			${ns.name}: {
				${namespaceDeclarations(ns as NamespaceBase)}
			}
		`).join('\n')}
	`;
}
