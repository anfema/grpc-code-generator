import * as path from 'path';
import { Root, ReflectionObject, NamespaceBase, Namespace, Type, Service } from 'protobufjs';


export function fileNameForNamespace(namespace: Namespace): string {
	const parents = [...parentChainOf(namespace), namespace]
		.slice(1) // omit the root namespace
		.map(p => p.name);

	return path.join(...parents, 'index.d.ts');
}

export function indent(value: string, level: number, indenter: string = "\t"): string {
	const indent = "\n" + indenter.repeat(level);
	const match = value.match(/^(.*)$/gm);

	return match
		? match.join(indent)
		: value;
}

/**
 * An array of all namespaces as seen from @arg namespace, including transitive namespaces
 * and the namespace given as argument itself.
 *
 * @param namespace
 */
export function allNamespacesTransitiveOf(namespace: Namespace): Namespace[] {
	const done = new Set<Namespace>();
	const todo = new Set<Namespace>([namespace])

	while (todo.size > 0) {
		todo.forEach(ns => {
			todo.delete(ns);

			if (! done.has(ns)) {
				done.add(ns);
				allSubNamespacesOf(ns).forEach(ns => todo.add(ns));
			}
		});
	}

	return Array.from(done);
}

export function allSubNamespacesOf(namespace: Namespace): Namespace[] {
	return namespace.nestedArray.filter(ns =>
		ns instanceof Namespace && ns.constructor.name === 'Namespace'
	) as Namespace[];
}

export function allTypesOf(namespace: Namespace): Type[] {
	return namespace.nestedArray.filter(ns => ns instanceof Type) as Type[];
}

export function allServicesOf(namespace: Namespace): Service[] {
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