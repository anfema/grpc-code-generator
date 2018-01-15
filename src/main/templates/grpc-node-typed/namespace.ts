import { Root, Namespace, Type, Service, Field, Method } from 'protobufjs'
import {
	allRecursiveNamespacesOf, allServicesOf, allTypesOf, indent, allNamespaceImportDeclarations,
	namespacedReferenceForType, banner
} from '../utils';
import { name } from '.';


export default function(namespace: Namespace, root: Root): string {
	const messageTypes = allTypesOf(namespace)
		.map(ns => typeDeclaration(ns));


	return (
`${banner(name)}
import { Message, Long } from 'protobufjs';

${allNamespaceImportDeclarations(root, namespace).join("\n")}


${messageTypes.join("\n\n")}`);
}

function typeDeclaration(type: Type): string {
	const fields = type.fieldsArray
		.map(field => fieldDeclaration(field));

	return (
`export interface ${type.name} {
	${indent(fields.join("\n"), 1)}
}`);
}

function fieldDeclaration(field: Field): string {
	const comment = field.comment ? `/** ${field.comment} */\n` : '';

	return (
`${comment}${field.name}: ${typeForField(field)};`);
}

function typeForField(field: Field): string {
	const arraySignifier = field.repeated ? '[]' : '';

	switch (field.type) {
	case 'double':
	case 'float':
	case 'int32':
	case 'uint32':
	case 'sint32':
	case 'fixed32':
	case 'sfixed32':
		return `number${arraySignifier}`;
	case 'int64':
	case 'uint64':
	case 'sint64':
	case 'fixed64':
	case 'sfixed64':
		return `Long${arraySignifier}`;
	case 'bool':
		return `boolean${arraySignifier}`;
	case 'string':
		return `string${arraySignifier}`;
	case 'bytes':
		return `Buffer${arraySignifier}`; // TODO Uint8Array
	default:
		field.resolve();
		//messageType | enumType
		if (field.resolvedType) {
			return `${field.resolvedType.name}${arraySignifier}`;
		}
		else {
			throw new Error(`could not resolve type for field '${field.fullName}'`);
		}
	}
}
