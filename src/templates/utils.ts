import * as path from 'path';
import { Root, ReflectionObject, NamespaceBase, Namespace, Type, Enum, Service } from 'protobufjs';


export function directoryForService(service: Service): string {
	const parents = parentChainOf(service)
		.slice(1) // omit the root namespace
		.map(p => p.name);

	return path.join(...parents);
}

export function fileNameForNamespace(namespace: Namespace): string {
	const parents = [...parentChainOf(namespace), namespace]
		.slice(1) // omit the root namespace
		.map(p => p.name);

	return path.join(...parents, 'index.d.ts');
}

/**
 * An array of all namespaces as seen from @arg namespace, including transitive namespaces
 * and the namespace given as argument itself.
 *
 * @param namespace
 */
export function recursiveNamespacesOf(namespace: Namespace): Namespace[] {
	const done = new Set<Namespace>();
	const todo = new Set<Namespace>([namespace])

	while (todo.size > 0) {
		todo.forEach(ns => {
			todo.delete(ns);

			if (! done.has(ns)) {
				done.add(ns);
				namespacesOf(ns).forEach(ns => todo.add(ns));
			}
		});
	}

	return Array.from(done);
}

export function recursiveServicesOf(namespace: NamespaceBase): Service[] {
	return recursiveNamespacesOf(namespace)
		.map(ns => servicesOf(ns))
		.reduce((acc, services) => acc.concat(services), []);
}

export function recursiveTypesOf(namespace: NamespaceBase): Type[] {
	return recursiveNamespacesOf(namespace)
		.map(ns => typesOf(ns))
		.reduce((acc, services) => acc.concat(services), []);
}

export function namespacesOf(namespace: NamespaceBase): NamespaceBase[] {
	return namespace.nestedArray.filter(
		ns => ns.constructor === Namespace || ns.constructor === Type
	) as NamespaceBase[];
}

export function typesOf(namespace: Namespace): Type[] {
	return namespace.nestedArray.filter(ns => ns instanceof Type) as Type[];
}

export function enumsOf(namespace: NamespaceBase): Enum[] {
	return namespace.nestedArray.filter(ns => ns instanceof Enum) as Enum[];
}

export function servicesOf(namespace: NamespaceBase): Service[] {
	return namespace.nestedArray.filter(ns => ns instanceof Service) as Service[];
}

/**
 * Returns the chain of parents up to and including the root namespace
 *
 * @param obj
 */
export function parentChainOf(obj: ReflectionObject): ReflectionObject[] {
	const parents = new Array<ReflectionObject>();

	for (let parent = obj.parent; parent !== null; parent = parent.parent) {
		parents.unshift(parent);
	}

	return parents;
}

export function namespaceImportDeclarations(root: Root, baseNs: Namespace): string[] {
	return recursiveNamespacesOf(root)
		.filter(ns => hasTypeOrEnum(ns))
		.map(ns => `import * as ${importReferenceFor(ns)} from '${importFileFor(ns, baseNs)}';`);
}

/**
 * The reference part of an import declaration (import * as <ref> from './file').
 */
export function importReferenceFor(obj: NamespaceBase): string {
	const parents = [...parentChainOf(obj), obj]
		.slice(1) // omit the root namespace
		.map(p => p.name);

	return `$${parents.join('$')}`;
}

/**
 * The _from_ part of an import declaration, a relative path from {@arg base}.
 */
export function importFileFor(target: Namespace, base: Namespace): string {
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

	return [...ascends, ...descends].join('/');
}

export function namespacedReferenceForType(type: Type | Enum): string {
	return `${importReferenceFor(type.parent as NamespaceBase)}.${type.name}`;
}

export function namespacedReferenceForService(service: Service): string {
	return importReferenceFor(service);
}

export function hasTypeOrEnum(ns: NamespaceBase): boolean {
	return ns.nestedArray.find(o => o.constructor === Type || o.constructor === Enum ||
		(o.constructor === Namespace && hasTypeOrEnum(o as Namespace) !== undefined)
	) !== undefined;
}