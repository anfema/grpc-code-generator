import { Field, Namespace, Root } from 'protobufjs';
import { name } from '.';
import { enumsOf, namespacedReferenceForType, namespaceImportDeclarations, typesOf } from '../utils';
import { banner, indent } from '../tags';

export default function(namespace: Namespace, root: Root): string {
	const messageTypes = typesOf(namespace);
	const enums = enumsOf(namespace);

	return indent`
		${banner(name)}

		import Long = require('long');
		${namespaceImportDeclarations(root, namespace).join('\n')}

		${messageTypes.map(t => indent`
			export interface ${t.name} {
				${t.fieldsArray.map(field => {
					const comment = field.comment ? `/** ${field.comment} */\n` : '';
					const optionalSignifier = field.partOf != undefined ? '?' : '';

					return `${comment}${field.name}${optionalSignifier}: ${typeForField(field)};`;
				}).join('\n')}
			}
		`).join('\n')}

		${enums.map(e => indent`
			export const enum ${e.name} {
				${Object.keys(e.values).map(key => `${key} = ${e.values[key]},`).join('\n')}
			}
		`).join('\n')}
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

			if (field.resolvedType) {
				return `${namespacedReferenceForType(field.resolvedType)}${arraySignifier}`;
			} else {
				throw new Error(`could not resolve type for field '${field.fullName}'`);
			}
	}
}
