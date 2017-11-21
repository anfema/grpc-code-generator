import { Service, Root, Method } from 'protobufjs';
import {
	indent, allNamespacesTransitiveOf, allNamespaceImportDeclarations, allServicesOf,
	namespacedReferenceForType
} from '../utils';


export function serviceInterface(service: Service, root: Root): string {
	return (
`import { Message, Long } from 'protobufjs';
import { Observable } from 'rxjs';
import { ObservableClientCall } from '@anfema/grpc-node-rxjs/src/client';
import { Call } from '@anfema/grpc-node-rxjs/src/server';
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
`export interface Client {
	${indent(methods.join("\n"), 1)}
}`);
}

function serverMethodDeclaration(method: Method): string {
	method.resolve();

	if (method.resolved && method.resolvedRequestType && method.resolvedResponseType) {
		const requestType = namespacedReferenceForType(method.resolvedRequestType);
		const responseType = namespacedReferenceForType(method.resolvedResponseType);

		if (method.responseStream && method.requestStream) {
			return `${method.name}(requestStream: Observable<${requestType}>, call?: Call): Promise<Observable<${responseType}>>;`
		}
		else if (method.responseStream) {
			return `${method.name}(request: ${requestType}, call?: Call): Promise<Observable<${responseType}>>;`
		}
		else if (method.requestStream) {
			return `${method.name}(requestStream: Observable<${requestType}>, call?: Call): Promise<${responseType}>;`
		}
		else {
			return `${method.name}(request: ${requestType}, call?: Call): Promise<${responseType}>`
		}
	}
	else {
		throw new Error(`could not resolve type for field '${method.fullName}'`);
	}
}

function clientMethodDeclaration(method: Method): string {
	method.resolve();

	if (method.resolved && method.resolvedRequestType && method.resolvedResponseType) {
		const requestType = namespacedReferenceForType(method.resolvedRequestType);
		const responseType = namespacedReferenceForType(method.resolvedResponseType);

		if (method.responseStream && method.requestStream) {
			return `${method.name}(requestStream: Observable<${requestType}>): ObservableClientCall<${responseType}>;`
		}
		else if (method.responseStream) {
			return `${method.name}(request: ${requestType}): ObservableClientCall<${responseType}>;`
		}
		else if (method.requestStream) {
			return `${method.name}(requestStream: Observable<${requestType}>): ObservableClientCall<${responseType}>;`
		}
		else {
			return `${method.name}(request: ${requestType}): ObservableClientCall<${responseType}>;`
		}
	}
	else {
		throw new Error(`could not resolve type for field '${method.fullName}'`);
	}
}




