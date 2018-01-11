import { Root, Namespace, Type, Service, Field, Method } from 'protobufjs';
import {
	indent, allNamespacesTransitiveOf, allNamespaceImportDeclarations, allServicesOf,
	namespacedReferenceForType
} from '../utils';


export default function(service: Service, root: Root): string {
	return (
`import { Message, Long } from 'protobufjs';
import {
	Client as GrpcClient,
	ServerUnaryCall, ServiceDefinition,
	ServerReadableStream, ServerWriteableStream, ServerDuplexStream,
	ClientReadableStream, ClientWritableStream, ClientDuplexStream,
	sendUnaryData,
} from 'grpc';
${allNamespaceImportDeclarations(root, service).join("\n")}


${serviceServerDeclaration(service)}

${serviceClientDeclaration(service)}`);
}

function serviceServerDeclaration(service: Service): string {
	const methods = service.methodsArray.map(method => serverMethodDeclaration(method as Method));

	return (
`export interface Service {
	${indent(methods.join("\n"), 1)}
}`);
}

function serviceClientDeclaration(service: Service): string {
	const methods = service.methodsArray.map(method => clientMethodDeclaration(method as Method));

	return (
`export class Client extends GrpcClient {
	static service: ServiceDefinition<Service>;

	${indent(methods.join("\n"), 1)}
}`);
}

function serverMethodDeclaration(method: Method): string {
	try {
		method.resolve();

		if (method.resolved && method.resolvedRequestType && method.resolvedResponseType) {
			const requestType = namespacedReferenceForType(method.resolvedRequestType);
			const responseType = namespacedReferenceForType(method.resolvedResponseType);

			if (method.responseStream && method.requestStream) {
				return `${method.name}(call: ServerDuplexStream<${requestType}, ${responseType}>): void;`
			}
			else if (method.responseStream) {
				return `${method.name}(call: ServerWriteableStream<${requestType}>): void;`
			}
			else if (method.requestStream) {
				return `${method.name}(call: ServerReadableStream<${requestType}>, callback: sendUnaryData<${responseType}>): void;`
			}
			else {
				return `${method.name}(call: ServerUnaryCall<${requestType}>, callback: sendUnaryData<${responseType}>): void;`
			}
		}
		else {
			throw undefined;
		}
	}
	catch (err) {
		throw new Error(`${method.filename}:

Cannot resolve type for field '${method.fullName}'`);
	}
}

function clientMethodDeclaration(method: Method): string {
	try {
		method.resolve();

		if (method.resolved && method.resolvedRequestType && method.resolvedResponseType) {
			const requestType = namespacedReferenceForType(method.resolvedRequestType);
			const responseType = namespacedReferenceForType(method.resolvedResponseType);

			if (method.responseStream && method.requestStream) {
				return `${method.name}(): ClientDuplexStream<${requestType}, ${responseType}>;`
			}
			else if (method.responseStream) {
				return `${method.name}(arg: ${requestType}): ClientReadableStream<${responseType}>;`
			}
			else if (method.requestStream) {
				return `${method.name}(callback: sendUnaryData<${responseType}>): ClientWritableStream<${requestType}>;`
			}
			else {
				return `${method.name}(arg: ${requestType}, callback: sendUnaryData<${responseType}>): void;`
			}
		}
		else {
			throw undefined;
		}
	}
	catch (err) {
		throw new Error(`${method.filename}:

Cannot resolve type for field '${method.fullName}'`);
	}
}

