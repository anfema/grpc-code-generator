import * as path from 'path';
import { Root } from 'protobufjs';
import { createGrpcServices, parseProtoFiles } from '../main/load';
import Description from './gen/grpc-node';

const rootPath = path.join(process.cwd(), 'src', 'tests', 'proto');
const protoPath = path.join(process.cwd(), 'src', 'tests', 'proto', 'test.proto');

let reflectionRoot: Root;

export async function grpcServices(): Promise<Description> {
	return createGrpcServices(reflectionRoot || await parseProtoFiles([rootPath], [protoPath]));
}

