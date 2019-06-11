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

function namespaceDeclarations(ns: NamespaceBase): string {
	const subNamespaces = namespacesOf(ns).filter(ns => recursiveServicesOf(ns).length > 0);

	return indent`
		${servicesOf(ns).map(s => `${s.name}: ${namespacedReferenceForService(s)}.ClientConstructor;`).join('\n')}
		${subNamespaces.map(ns => indent`
			${ns.name}: {
				${namespaceDeclarations(ns)}
			}
		`).join('\n')}
	`;
}
