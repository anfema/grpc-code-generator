import { Namespace, NamespaceBase, Root, Type } from 'protobufjs';
import { name } from '.';
import { namespacedReferenceForType, namespaceImportDeclarations, namespacesOf } from '../utils';
import { banner, indent } from '../tags';

export default (root: Root) => indent`
	${banner(name)}

	import { Type } from './protobufjs6-type';
	${namespaceImportDeclarations(root, root).join('\n')}

	export default interface ProtobufJs6 {
		${namespaceDeclarations(root)}
	}
`;

function namespaceDeclarations(ns: NamespaceBase): string {
	const subNamespaces = namespacesOf(ns)
		.map(ns => subNamespaceDeclaration(ns));

	return indent`
		${ns instanceof Type ? `_Message: Type<${namespacedReferenceForType(ns)}>;` : ''}
		${subNamespaces.join('\n')}
	`;
}

const subNamespaceDeclaration = (ns: Namespace) => indent`
	${ns.name}: {
		${namespaceDeclarations(ns as NamespaceBase)}
	}
`;
