import * as path from 'path';
import { load, credentials } from 'grpc';
import { Client } from './gen/TestService/grpc-node';
import { grpc } from './proto';

export function createClient(port: number): Client {
	return new grpc.TestService(`0.0.0.0:${port}`, credentials.createInsecure())
}
