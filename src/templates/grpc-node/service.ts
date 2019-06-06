import { Method, Root, Service } from 'protobufjs';
import { name } from '.';
import { banner, indent, namespacedReferenceForType, namespaceImportDeclarations } from '../utils';

export default function(service: Service, root: Root): string {
	return `${banner(name)}
import Long = require('long');
import {
	Client as GrpcClient, Metadata, CallOptions, ChannelCredentials,
	ServerUnaryCall, ServiceDefinition,
	ServerReadableStream, ServerWriteableStream, ServerDuplexStream,
	ClientReadableStream, ClientWritableStream, ClientDuplexStream,
	sendUnaryData, requestCallback
} from 'grpc';
${namespaceImportDeclarations(root, service).join('\n')}


${serviceServerDeclaration(service)}

${serviceClientDeclaration(service)}`;
}

function serviceServerDeclaration(service: Service): string {
	const methods = service.methodsArray.map(method => serverMethodDeclaration(method as Method));

	return `export interface Service {
	${indent(methods.join('\n'), 1)}
}`;
}

function serviceClientDeclaration(service: Service): string {
	const methods = service.methodsArray.map(method => clientMethodDeclaration(method as Method));

	return `export interface ClientConstructor {
	service: ServiceDefinition<Service>;
	new(address: string, credentials: ChannelCredentials, options?: object): Client;
}

export interface Client extends GrpcClient {
	${indent(methods.join('\n'), 1)}
}
`;
}

function serverMethodDeclaration(method: Method): string {
	try {
		method.resolve();

		if (method.resolved && method.resolvedRequestType && method.resolvedResponseType) {
			const requestType = namespacedReferenceForType(method.resolvedRequestType);
			const responseType = namespacedReferenceForType(method.resolvedResponseType);

			if (method.responseStream && method.requestStream) {
				return `${method.name}(call: ServerDuplexStream<${requestType}, ${responseType}>): void;`;
			} else if (method.responseStream) {
				return `${method.name}(call: ServerWriteableStream<${requestType}>): void;`;
			} else if (method.requestStream) {
				return `${
					method.name
				}(call: ServerReadableStream<${requestType}>, callback: sendUnaryData<${responseType}>): void;`;
			} else {
				return `${
					method.name
				}(call: ServerUnaryCall<${requestType}>, callback: sendUnaryData<${responseType}>): void;`;
			}
		} else {
			throw undefined;
		}
	} catch (err) {
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
				return `${
					method.name
				}(metadata?: Metadata | null, options?: CallOptions | null): ClientDuplexStream<${requestType}, ${responseType}>;`;
			} else if (method.responseStream) {
				return `${
					method.name
				}(arg: ${requestType}, metadata?: Metadata | null, options?: CallOptions | null): ClientReadableStream<${responseType}>;`;
			} else if (method.requestStream) {
				return `${
					method.name
				}(metadata: Metadata | null, options: CallOptions | null, callback: requestCallback<${responseType}>): ClientWritableStream<${requestType}>;`;
			} else {
				return `${
					method.name
				}(arg: ${requestType}, metadata: Metadata | null, options: CallOptions | null, callback: requestCallback<${responseType}>): void;`;
			}
		} else {
			throw new Error();
		}
	} catch (err) {
		throw new Error(`${method.filename}:

Cannot resolve type for field '${method.fullName}'`);
	}
}
