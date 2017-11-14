import { Root, Namespace, Type, Service, Field, Method } from 'protobufjs'
import { allNamespacesTransitiveOf, allServicesOf, allTypesOf, indent } from '../utils';
import { namespacedReferenceFor, importDeclaration } from './';


export default function (namespace: Namespace, root: Root): string {
	const imports = allNamespacesTransitiveOf(root)
		.map(ns => importDeclaration(ns, namespace));

	const messageTypes = allTypesOf(namespace)
		.map(ns => typeDefinition(ns));

	const serviceTypes = allServicesOf(namespace)
		.map(ns => serviceDefinition(ns));

	return (
`import { Message, Long } from 'protobufjs';
import {
	Client as GrpcClient,
	ServerUnaryCall, ServiceDefinition,
	ServerReadableStream, ServerWriteableStream, ServerDuplexStream,
	ClientReadableStream, ClientWritableStream, ClientDuplexStream,
	sendUnaryData,
} from 'grpc';
${imports.join("\n")}


${messageTypes.join("\n\n")}

${serviceTypes.join("\n\n")}`);
}

function typeDefinition(type: Type): string {
	const fields = type.fieldsArray
		.map(field => fieldDefinition(field));

	return (
`export interface ${type.name} {
	${indent(fields.join("\n\n"), 1)}
}`);
}

function serviceDefinition(service: Service): string {
	return (
`export namespace ${service.name} {
	${indent(serviceServerDefinition(service), 1)}

	${indent(serviceClientDefinition(service), 1)}
}`);
}

function serviceServerDefinition(service: Service): string {
	const methods = service.methodsArray.map(method => serverMethodDefinition(method as Method));

	return (
`export interface Service {
	${indent(methods.join("\n"), 1)}
}`);
}

function serviceClientDefinition(service: Service): string {
	const methods = service.methodsArray.map(method => clientMethodDefinition(method as Method));

	return (
`export class Client extends GrpcClient {
	static service: ServiceDefinition<Service>;

	${indent(methods.join("\n"), 1)}
}`);
}

function fieldDefinition(field: Field): string {
	return (
`/** ${field.comment} */
${field.name}: ${typeForField(field)};`);
}

function serverMethodDefinition(method: Method): string {
	method.resolve();

	if (method.resolved) {
		if (method.responseStream && method.requestStream) {
			return `${method.name}(call: ServerDuplexStream<${method.requestType}, ${method.responseType}>): void;`
		}
		else if (method.responseStream) {
			return `${method.name}(call: ServerWriteableStream<${method.requestType}>): void;`
		}
		else if (method.requestStream) {
			return `${method.name}(call: ServerReadableStream<${method.requestType}>, callback: sendUnaryData<${method.responseType}>): void;`
		}
		else {
			return `${method.name}(call: ServerUnaryCall<${method.requestType}>, callback: sendUnaryData<${method.responseType}>): void;`
		}
	}
	else {
		throw new Error(`could not resolve type for field '${method.fullName}'`);
	}
}

function clientMethodDefinition(method: Method): string {
	method.resolve();

	if (method.resolved) {
		if (method.responseStream && method.requestStream) {
			return `${method.name}(): ClientDuplexStream<${method.requestType}, ${method.responseType}>;`
		}
		else if (method.responseStream) {
			return `${method.name}(arg: ${method.requestType}): ClientReadableStream<${method.responseStream}>;`
		}
		else if (method.requestStream) {
			return `${method.name}(callback: sendUnaryData<${method.responseType}>): ClientWritableStream<${method.requestType}>;`
		}
		else {
			return `${method.name}(arg: ${method.requestType}, callback: sendUnaryData<${method.responseType}>): void;`
		}
	}
	else {
		throw new Error(`could not resolve type for field '${method.fullName}'`);
	}
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
