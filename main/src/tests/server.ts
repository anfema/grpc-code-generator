import * as process from 'process';
import {
	Server, ServerCredentials,
	ServerUnaryCall, ServerWriteableStream, ServerReadableStream, ServerDuplexStream,
	sendUnaryData
} from 'grpc';
import { Request, Response } from '../gen';
import { Service as TestService} from '../gen/TestService/grpc-node';
import { sleep } from './utils';
import { getState } from './state';
import { grpc } from './proto';


class TestServiceHandler implements TestService {
	unaryCall(call: ServerUnaryCall<Request>, callback: sendUnaryData<Response>): void {
		const request = call.request;

		switch (request.mode) {
		case 'normal':
			callback(null, new grpc.Response());
			break;
		case 'slow':
			setTimeout(() => {
				callback(null, new grpc.Response());
			}, 1000);
			break;
		case 'retry':
			const state = getState(request.id)
			if (state.retries === 2) {
				callback(null, new grpc.Response());
			}
			else {
				state.retries++;
				callback(new Error('Expected error in unaryCall()'), null);
			}
			break;
		case 'error':
			callback(new Error('Expected error in unaryCall()'), null);
			break;
		default:
			throw new Error('Unexpected error in unaryCall()');
		}
	}

	streamResponse(call: ServerWriteableStream<Request>): void {
		const request = call.request;

		switch (request.mode) {
		case 'normal':
			for (let i = 0; i < request.count; i++) {
				call.write(new grpc.Response());
			}
			call.end();
			break;
		case 'slow':
			setTimeout(() => {
				for (let i = 0; i < request.count; i++) {
					call.write(new grpc.Response());
				}
				call.end();
			}, 1000);
			break;
		case 'retry':
			const state = getState(request.id)
			if (state.retries === 2) {
				for (let i = 0; i < request.count; i++) {
					call.write(new grpc.Response());
				}
				call.end();
			}
			else {
				state.retries++;
				call.emit('error', new Error('Expected error in unaryCall()'));
			}
			break;
		case 'error':
			call.emit('error', new Error('Expected error in unaryCall()'));
				break;
		default:
			throw new Error('Unexpected error in streamResponse()');
		}
	}

	streamRequest(call: ServerReadableStream<Request>, callback: sendUnaryData<Response>): void {
		const requests = new Array<Request>();

		call
			.on('data', (data: Request) => {
				requests.push(data);
				// TODO fail here for retry calls?
			})
			.on('error', (error) => {
				const request = requests[0];
			})
			.on('end', () => {
				const request = requests[0];
				switch (request.mode) {
				case 'normal':
					callback(null, new grpc.Response());
					break;
				case 'slow':
					setTimeout(() => {
						callback(null, new grpc.Response());
					}, 1000);
					break;
				case 'retry':
					const state = getState(request.id)
					if (state.retries === 2) {
						callback(null, new grpc.Response());
					}
					else {
						state.retries++;
						callback(new Error('Expected error in unaryCall()'), null);
					}
					break;
				case 'error':
					callback(new Error('Expected error in unaryCall()'), null);
					break;
				default:
					throw new Error('Unexpected error in streamResponse()');
				}
			});
	}

	streamBidi(call: ServerDuplexStream<Request, Response>): void {
		const requests = new Array<Request>();

		call
			.on('data', (data: Request) => {
				requests.push(data);
			})
			.on('error', (error) => {
			})
			.on('end', () => {
				const request = requests[0];

				switch (request.mode) {
				case 'normal':
					for (let i = 0; i < request.count; i++) {
						call.write(new grpc.Response());
					}
					call.end();
				case 'slow':
					setTimeout(() => {
						for (let i = 0; i < request.count; i++) {
							call.write(new grpc.Response());
						}
						call.end();
					}, 1000);
					break;
				case 'retry':
					const state = getState(request.id)
					if (state.retries === 2) {
						for (let i = 0; i < request.count; i++) {
							call.write(new grpc.Response());
						}
						call.end();
					}
					else {
						state.retries++;
						call.emit('error', new Error('Expected error in unaryCall()'));
					}
					break;
				case 'error':
					call.emit('error', new Error('Expected error in unaryCall()'));
					break;
				default:
					throw new Error('Unexpected error in streamResponse()');
				}
			});
	}
}

export function createServer(): number {
	const port = Math.round(Math.random() * 20000 + 10000);

	const server = new Server();

	server.addService(grpc.TestService.service, new TestServiceHandler());
	server.bind(`0.0.0.0:${port}`, ServerCredentials.createInsecure());
	server.start();

	return port;
}
