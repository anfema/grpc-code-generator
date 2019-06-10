import { Enum, Field, Namespace, Root, Type } from 'protobufjs';
import { name } from '.';
import { enumsOf, namespacedReferenceForType, namespaceImportDeclarations, typesOf } from '../utils';
import { banner, indent } from '../tags';

export default function(namespace: Namespace, root: Root): string {
	const messageTypes = typesOf(namespace).map(t => typeDeclaration(t));
	const enums = enumsOf(namespace).map(e => enumDeclaration(e));

	return indent`
		${banner(name)}

		import Long = require('long');
		${namespaceImportDeclarations(root, namespace).join('\n')}

		${messageTypes.join('\n')}
		${enums.join('\n')}
	`;
}

function typeDeclaration(type: Type): string {
	const fields = type.fieldsArray.map(field => fieldDeclaration(field));

	return indent`
		export interface ${type.name} {
			${fields.join('\n')}
		}
	`;
}

function fieldDeclaration(field: Field): string {
	const comment = field.comment ? `/** ${field.comment} */\n` : '';
	const optionalSignifier = field.partOf != undefined ? '?' : '';

	return `${comment}${field.name}${optionalSignifier}: ${typeForField(field)};`;
}

function enumDeclaration(enumeration: Enum): string {
	const values = Object.keys(enumeration.values).map(key => `${key} = ${enumeration.values[key]},`);

	return indent`
		export const enum ${enumeration.name} {
			${values.join('\n')}
		}
	`;
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
			return `Uint8Array${arraySignifier}`;
		default:
			field.resolve();
			//messageType | enumType
			if (field.resolvedType) {
				return `${namespacedReferenceForType(field.resolvedType)}${arraySignifier}`;
			} else {
				throw new Error(`could not resolve type for field '${field.fullName}'`);
			}
	}
}
