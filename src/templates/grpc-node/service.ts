import { Method, Root, Service } from 'protobufjs';
import { name } from '.';
import { namespacedReferenceForType, namespaceImportDeclarations } from '../utils';
import { indent, banner } from '../tags';

export default (service: Service, root: Root) => indent`
	${banner(name)}

	import Long = require('long');
	import {
		Client as GrpcClient, Metadata, CallOptions, ChannelCredentials,
		ServerUnaryCall, ServiceDefinition,
		ServerReadableStream, ServerWriteableStream, ServerDuplexStream,
		ClientReadableStream, ClientWritableStream, ClientDuplexStream,
		sendUnaryData, requestCallback
	} from 'grpc';
	${namespaceImportDeclarations(root, service).join('\n')}

	export interface Service {
		${service.methodsArray.map(m => serverMethodDeclaration(m)).join('\n')}
	}

	export interface ClientConstructor {
		service: ServiceDefinition<Service>;

		new(address: string, credentials: ChannelCredentials, options?: object): Client;
	}

	export interface Client extends GrpcClient {
		${service.methodsArray.map(m => clientMethodDeclaration(m)).join('\n')}
	}
`;

function serverMethodDeclaration(method: Method): string {
	method.resolve();

	if (method.resolved && method.resolvedRequestType && method.resolvedResponseType) {
		const reqType = namespacedReferenceForType(method.resolvedRequestType);
		const resType = namespacedReferenceForType(method.resolvedResponseType);

		if (method.responseStream && method.requestStream) {
			return `${method.name}(call: ServerDuplexStream<${reqType}, ${resType}>): void;`;
		} else if (method.responseStream) {
			return `${method.name}(call: ServerWriteableStream<${reqType}>): void;`;
		} else if (method.requestStream) {
			return `${method.name}(call: ServerReadableStream<${reqType}>, callback: sendUnaryData<${resType}>): void;`;
		} else {
			return `${method.name}(call: ServerUnaryCall<${reqType}>, callback: sendUnaryData<${resType}>): void;`;
		}
	} else {
		throw new Error(`${method.filename}: Cannot resolve type for field '${method.fullName}'`);
	}
}

function clientMethodDeclaration(method: Method): string {
	method.resolve();

	if (method.resolved && method.resolvedRequestType && method.resolvedResponseType) {
		const reqType = namespacedReferenceForType(method.resolvedRequestType);
		const resType = namespacedReferenceForType(method.resolvedResponseType);

		if (method.responseStream && method.requestStream) {
			return `${method.name}(metadata?: Metadata | null, options?: CallOptions | null): ClientDuplexStream<${reqType}, ${resType}>;`;
		} else if (method.responseStream) {
			return `${method.name}(arg: ${reqType}, metadata?: Metadata | null, options?: CallOptions | null): ClientReadableStream<${resType}>;`;
		} else if (method.requestStream) {
			return `${method.name}(metadata: Metadata | null, options: CallOptions | null, callback: requestCallback<${resType}>): ClientWritableStream<${reqType}>;`;
		} else {
			return `${method.name}(arg: ${reqType}, metadata: Metadata | null, options: CallOptions | null, callback: requestCallback<${resType}>): void;`;
		}
	} else {
		throw new Error(`${method.filename}: Cannot resolve type for field '${method.fullName}'`);
	}
}
