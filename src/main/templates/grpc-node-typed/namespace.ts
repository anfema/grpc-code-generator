import { Root, Namespace, Type, Service, Field, Method, Enum } from 'protobufjs'
import {
	recursiveNamespacesOf, servicesOf, typesOf, enumsOf, indent, namespaceImportDeclarations,
	namespacedReferenceForType, banner
} from '../utils';
import { name } from '.';


export default function(namespace: Namespace, root: Root): string {
	const messageTypes = typesOf(namespace).map(t => typeDeclaration(t));
	const enums = enumsOf(namespace).map(e => enumDeclaration(e));

	return (
`${banner(name)}
import { Message } from 'protobufjs';
import Long = require('long');

${namespaceImportDeclarations(root, namespace).join("\n")}

${messageTypes.join("\n")}
${enums.join("\n")}
`);
}

function typeDeclaration(type: Type): string {
	const fields = type.fieldsArray.map(field => fieldDeclaration(field));

	return (
`export interface ${type.name} {
	${indent(fields.join("\n"), 1)}
}
`);
}

function fieldDeclaration(field: Field): string {
	const comment = field.comment ? `/** ${field.comment} */\n` : '';
	const optionalSignifier = field.partOf != undefined ? '?' : '';

	return `${comment}${field.name}${optionalSignifier}: ${typeForField(field)};`;
}

function enumDeclaration(enumeration: Enum): string {
	const values = Object.keys(enumeration.values).map(key =>
		`${key} = ${enumeration.values[key]},`
	);

	return (
`export const enum ${enumeration.name} {
	${indent(values.join("\n"), 1)}
}
`);
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
			return `${namespacedReferenceForType(field.resolvedType)}${arraySignifier}`;
		}
		else {
			throw new Error(`could not resolve type for field '${field.fullName}'`);
		}
	}
}
