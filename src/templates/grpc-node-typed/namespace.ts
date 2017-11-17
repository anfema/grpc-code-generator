import { Root, Namespace, Type, Service, Field, Method } from 'protobufjs'
import {
	allNamespacesTransitiveOf, allServicesOf, allTypesOf, indent, allNamespaceImportDeclarations,
	namespacedReferenceForType
} from '../utils';
import {  } from './';


export default function(namespace: Namespace, root: Root): string {
	const messageTypes = allTypesOf(namespace)
		.map(ns => typeDeclaration(ns));


	return (
`import { Message, Long } from 'protobufjs';
import {
	Client as GrpcClient,
	ServerUnaryCall, ServiceDefinition,
	ServerReadableStream, ServerWriteableStream, ServerDuplexStream,
	ClientReadableStream, ClientWritableStream, ClientDuplexStream,
	sendUnaryData,
} from 'grpc';
${allNamespaceImportDeclarations(root, namespace).join("\n")}


${messageTypes.join("\n\n")}`);
}

function typeDeclaration(type: Type): string {
	const fields = type.fieldsArray
		.map(field => fieldDeclaration(field));

	return (
`export interface ${type.name} {
	${indent(fields.join("\n\n"), 1)}
}`);
}

function fieldDeclaration(field: Field): string {
	return (
`/** ${field.comment} */
${field.name}: ${typeForField(field)};`);
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
