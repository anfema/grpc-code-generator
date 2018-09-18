import * as fs from 'fs';
import { deserialize, GrpcObject, loadPackageDefinition, MethodDefinition, PackageDefinition, serialize, ServiceDefinition } from 'grpc';
import * as path from 'path';
import { IConversionOptions, IParseOptions, Method, Namespace, NamespaceBase, Root, Service, Type } from 'protobufjs';
import { namespacesOf, typesOf } from './templates/utils';

// TODO this should go into its own package

/**
 * Load .proto files with a set of root paths, with the same import resolution logic like 'protoc'
 * into a protobufjs root. This object can then be used with {@function createMessageTypes} and
 * {@function createGrpcServices}.
 *
 * If the path is absolute, try to load the file as is, otherwise try to prepend the root paths in
 * the given order and try to load the proto file.
 *
 * @param protoPaths An array of paths to proto files.
 * @param rootPaths An array of paths used as import root. If the a path is not absolute, it will be
 * 		interpreted as relative to the current working directory.
 * @param options Parse options from protobufjs load() method.
 * @returns A protobuf reflection object
 */
export function parseProtoFiles(rootPaths: string[], protoPaths: string[], options?: IParseOptions): Promise<Root> {
	const cwd = process.cwd();
	const roots = rootPaths.map(p => path.isAbsolute(p) ? p : path.join(cwd, p));

	const root = new Root();
	root.resolvePath = (origin: string, target: string) => resolvePath(roots, origin, target);

	return root.load(protoPaths, options);
}

/**
 * Create an object with message constructors for use with the `protobufjs6` template.
 *
 * @param protobufReflectionRoot The reflection root object from {@function parseProtoFiles}.
 * @returns An object that conforms to the interface `ProtobufJs6` of the `protobufjs6` template.
 */
export function createMessageTypes<T>(protobufReflectionRoot: Root): T {
	const holder = {};
	createMessageTypesRecursive(holder, protobufReflectionRoot);

	return holder as T;
}

/**
 * Create an object with service constructors for use with the `grpc-node` template.
 *
 * @param protobufReflectionRoot  The reflection root object from {@function parseProtoFiles}.
 * @param options Conversion options
 * @returns An object that conforms to the interface `Grpc` of the `grpc-node` template.
 */
export function createGrpcServices<T extends GrpcObject>(protobufReflectionRoot: Root, options?: IConversionOptions): T {
	protobufReflectionRoot.resolveAll();
	const packageDefinition = createPackageDefinition(protobufReflectionRoot, options);

	return loadPackageDefinition(packageDefinition) as T;
}

function createPackageDefinition(root: Root, options?: IConversionOptions): PackageDefinition {
	const def: any = {};
	for (const [name, service] of getAllServices(root, '')) {
		def[name] = createServiceDefinition(service, name, options);
	}
	return def as PackageDefinition;
}

function createServiceDefinition(service: Service, name: string, options?: IConversionOptions): ServiceDefinition<object> {
	const def: any  = {};
	for (const method of service.methodsArray) {
		def[method.name] = createMethodDefinition(method, name, options);
	}

	return def as ServiceDefinition<object>;
}

function getAllServices(obj: NamespaceBase, parentName: string): Array<[string, Service]> {
	const objName = parentName === ''
		? obj.name
		: parentName + '.' + obj.name;

	if (obj.hasOwnProperty('methods')) {
		return [[objName, obj as Service]];
	}
	else {
		return obj.nestedArray.map((child) => {
			return child.hasOwnProperty('nested')
				? getAllServices(child as NamespaceBase, objName)
				: [];
		}).reduce((accumulator, currentValue) => accumulator.concat(currentValue), []);
	}
}

function createMethodDefinition(method: Method, serviceName: string, options?: IConversionOptions): MethodDefinition<object, object> {
	return {
		path: '/' + serviceName + '/' + method.name,
		requestStream: !!method.requestStream,
		responseStream: !!method.responseStream,
		requestSerialize: createSerializer(method.resolvedRequestType as Type),
		requestDeserialize: createDeserializer(method.resolvedRequestType as Type, options),
		responseSerialize: createSerializer(method.resolvedResponseType as Type),
		responseDeserialize: createDeserializer(method.resolvedResponseType as Type, options),
		// TODO(murgatroid99): Find a better way to handle this
		// originalName: _.camelCase(method.name)
	};
}

function createDeserializer(cls: Type, options?: IConversionOptions): deserialize<object> {
	return function deserialize(argBuf: Buffer): object {
		return cls.toObject(cls.decode(argBuf), options);
	};
}

function createSerializer(cls: Type): serialize<object> {
	return function serialize(arg: object): Buffer {
		const message = cls.fromObject(arg);
		return cls.encode(message).finish() as Buffer;
	};
}

function resolvePath(rootPaths: string[], origin: string, target: string): string {
	if (path.isAbsolute(target)) {
		// top level file
		return target;
	}
	else {
		const resolvedRoot = rootPaths.find(r => exists(path.join(r, target)));

		if (resolvedRoot) {
			// resolved via one of rootPaths
			return path.join(resolvedRoot, target);
		}
		else {
			// resolve relative to origin, even it is out of spec?
			throw new Error(`Could not find file "${target}"`);
		}
	}
}

function exists(path: string): boolean {
	try {
		fs.accessSync(path);
		return true;
	}
	catch (err) {
		return false
	}
}

function createMessageTypesRecursive(messageTypes: any, namespace: Namespace): void {
	const types = typesOf(namespace);

	namespacesOf(namespace).forEach(ns => {
		const namespaceHolder: any = {};
		const type = types.find(type => type.name === ns.name)
		if (type) {
			namespaceHolder[ '_Message' ] = type;
		}

		messageTypes[ ns.name ] = namespaceHolder;

		if (ns instanceof Type) {
			namespace
		}

		createMessageTypesRecursive(namespaceHolder, ns);
	});
}