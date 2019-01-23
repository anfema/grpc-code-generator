import * as path from 'path';
import { Root } from 'protobufjs';
import { createGrpcServices, parseProtoFiles } from '../load';
import Description from './gen/grpc-node';

const rootPath = path.join(process.cwd(), 'src', '__tests__', 'proto');
const protoPath = path.join(process.cwd(), 'src', '__tests__', 'proto', 'test.proto');

let reflectionRoot: Root;

export async function grpcServices(): Promise<Description> {
	reflectionRoot = reflectionRoot || await parseProtoFiles([rootPath], [protoPath]);

	return createGrpcServices<Description>(reflectionRoot);
}

