import { credentials } from 'grpc';
import { Client } from './gen/TestService/grpc-node';
import { grpcServices } from './proto';

export async function createClient(port: number): Promise<Client> {
	const grpc = await grpcServices();
	return new grpc.TestService(`0.0.0.0:${port}`, credentials.createInsecure())
}
