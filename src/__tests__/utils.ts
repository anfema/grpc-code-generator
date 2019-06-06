import { ClientReadableStream, Server, ServerCredentials, credentials } from 'grpc';
import { setTimeout } from 'timers';
import { grpcServices } from './proto';
import { TestServiceHandler } from './server';
import { Client } from './gen/TestService/grpc-node';

export function callbackAsPromise<T>(fn: (callback: (error: any, data: T | undefined) => void) => void): Promise<T> {
	return new Promise((resolve, reject) => {
		fn((error, data) => {
			if (error) {
				reject(error);
			} else if (data) {
				resolve(data);
			}
		});
	});
}

export function sleep(timeoutMs: number): Promise<void> {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, timeoutMs);
	});
}

export function timeout(timeoutMs: number, ...promises: Promise<any>[]): Promise<any> {
	return Promise.race([
		...promises,
		new Promise((resolve, reject) => {
			setTimeout(() => {
				reject(new Error(`Timeout after ${timeoutMs} ms`));
			}, timeoutMs);
		}),
	]);
}

export function readStreamAsPromise<T>(stream: ClientReadableStream<T>): Promise<T[]> {
	return new Promise((resolve, reject) => {
		const data: T[] = [];

		stream
			.on('data', (response: T) => {
				data.push(response);
			})
			.on('error', error => {
				reject(error);
			})
			.on('end', () => {
				resolve(data);
			});
	});
}

export async function withTestApplication<T>(fn: (ctx: Client) => Promise<T>): Promise<T> {
	const grpc = await grpcServices();
	const port = Math.round(Math.random() * 20000 + 10000);

	const server = new Server();
	server.addService(grpc.TestService.service, new TestServiceHandler());
	server.bind(`0.0.0.0:${port}`, ServerCredentials.createInsecure());
	server.start();

	const client = new grpc.TestService(`0.0.0.0:${port}`, credentials.createInsecure());

	try {
		return await fn(client);
	} finally {
		server.forceShutdown();
	}
}
