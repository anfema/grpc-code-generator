import * as path from 'path';
import { Root, ReflectionObject, NamespaceBase, Namespace, Type, Service } from 'protobufjs'
import { parentChainOf, allNamespacesTransitiveOf } from '../utils';
import { TemplateFunction, TemplateMap } from '../..';
import implementation from './implementation';
import messageBase from './message-base';
import namespace from './namespace';


export default function(templateMap: TemplateMap, root: Root): void {
	templateMap
		.addTemplate('grpc.d.ts', implementation(root))
		.addTemplate('message-base.d.ts', messageBase());

	allNamespacesTransitiveOf(root).forEach(ns => {
		templateMap.addTemplate(fileNameForNamespace(ns), namespace(ns, root))
	});
}

export function namespacedReferenceFor(type: ReflectionObject): string {
	const chain = parentChainOf(type);
	const parents = parentChainOf(type)
		.slice(1) // omit the root namespace
		.map(p => p.name);

	return `$${parents.join('$')}.${type.name}`;
}

/**
 * The reference part of an import declaration (import * as <ref> from './file').
 */
function importReferenceFor(namespace: NamespaceBase): string {
	const parents = [...parentChainOf(namespace), namespace]
		.slice(1) // omit the root namespace
		.map(p => p.name);

	return `$${parents.join('$')}`;
}

/**
 * The _from_ part of an import declaration, a relative path from {@arg base}.
 */
function importFileFor(target: Namespace, base: Namespace): string {
	const targetTrail = [...parentChainOf(target), target];
	const baseTrail = [...parentChainOf(base), base];

	// find last common base of both trails;
	let i = 0;
	while (i < targetTrail.length && i < baseTrail.length && targetTrail[i] === baseTrail[i]) {
		i++;
	}

	const ascends = new Array(baseTrail.length - i).fill('..');
	const descends = targetTrail.slice(i).map(ns => ns.name);

	if (ascends.length === 0) {
		descends.unshift('.');
	}

	return [...ascends, ...descends ].join('/');
}

export function importDeclaration(ns: Namespace, baseNs: Namespace): string {
	return `import * as ${importReferenceFor(ns)} from '${importFileFor(ns, baseNs)}';`;
}
