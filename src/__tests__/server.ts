import { sendUnaryData, ServerDuplexStream, ServerReadableStream, ServerUnaryCall, ServerWriteableStream } from 'grpc';
import { Request, Response } from './gen';
import { Service as TestService } from './gen/TestService/grpc-node';
import { Mode } from './gen/Request';

interface State {
	retries: number;
}

export class TestServiceHandler implements TestService {
	private readonly state = new Map<string, State>();

	unaryCall(call: ServerUnaryCall<Request>, callback: sendUnaryData<Response>): void {
		const request = call.request;

		switch (request.mode) {
			case Mode.DEFAULT:
				callback(null, { id: request.id });
				break;
			case Mode.SLOW:
				setTimeout(() => {
					callback(null, { id: request.id });
				}, 1000);
				break;
			case Mode.RETRY:
				const state = this.getState(request.id);
				if (state.retries === 2) {
					callback(null, { id: request.id });
				} else {
					state.retries++;
					callback(new Error('Expected error in unaryCall()'), null);
				}
				break;
			case Mode.ERROR:
				callback(new Error('Expected error in unaryCall()'), null);
				break;
			default:
				throw new Error('Unexpected error in unaryCall()');
		}
	}

	streamResponse(call: ServerWriteableStream<Request>): void {
		const request = call.request;

		switch (request.mode) {
			case Mode.DEFAULT:
				for (let i = 0; i < 3; i++) {
					call.write({ id: request.id });
				}
				call.end();
				break;
			case Mode.SLOW:
				setTimeout(() => {
					for (let i = 0; i < 3; i++) {
						call.write({ id: request.id });
					}
					call.end();
				}, 1000);
				break;
			case Mode.RETRY:
				const state = this.getState(request.id);
				if (state.retries === 2) {
					for (let i = 0; i < 3; i++) {
						call.write({});
					}
					call.end();
				} else {
					state.retries++;
					call.emit('error', new Error('Expected error in unaryCall()'));
				}
				break;
			case Mode.ERROR:
				call.emit('error', new Error('Expected error in unaryCall()'));
				break;
			default:
				throw new Error('Unexpected error in streamResponse()');
		}
	}

	streamRequest(call: ServerReadableStream<Request>, callback: sendUnaryData<Response>): void {
		const requests = new Array<Request>();

		call.on('data', (data: Request) => {
			requests.push(data);
			// TODO fail here for retry calls?
		})
			.on('error', error => {
				const request = requests[0];
			})
			.on('end', () => {
				const request = requests[0];
				switch (request.mode) {
					case Mode.DEFAULT:
						callback(null, { id: request.id });
						break;
					case Mode.SLOW:
						setTimeout(() => {
							callback(null, { id: request.id });
						}, 1000);
						break;
					case Mode.RETRY:
						const state = this.getState(request.id);
						if (state.retries === 2) {
							callback(null, { id: request.id });
						} else {
							state.retries++;
							callback(new Error('Expected error in unaryCall()'), null);
						}
						break;
					case Mode.ERROR:
						callback(new Error('Expected error in unaryCall()'), null);
						break;
					default:
						throw new Error('Unexpected error in streamResponse()');
				}
			});
	}

	streamBidi(call: ServerDuplexStream<Request, Response>): void {
		const requests = new Array<Request>();

		call.on('data', (data: Request) => {
			requests.push(data);
		})
			.on('error', error => {})
			.on('end', () => {
				const request = requests[0];

				switch (request.mode) {
					case Mode.DEFAULT:
						for (let i = 0; i < 3; i++) {
							call.write({});
						}
						call.end();
					case Mode.SLOW:
						setTimeout(() => {
							for (let i = 0; i < 3; i++) {
								call.write({});
							}
							call.end();
						}, 1000);
						break;
					case Mode.RETRY:
						const state = this.getState(request.id);
						if (state.retries === 2) {
							for (let i = 0; i < 3; i++) {
								call.write({});
							}
							call.end();
						} else {
							state.retries++;
							call.emit('error', new Error('Expected error in unaryCall()'));
						}
						break;
					case Mode.ERROR:
						call.emit('error', new Error('Expected error in unaryCall()'));
						break;
					default:
						throw new Error('Unexpected error in streamResponse()');
				}
			});
	}

	private getState(id: string): State {
		const info = this.state.get(id);

		if (info) {
			return info;
		} else {
			const newInfo = { retries: 0 };
			this.state.set(id, newInfo);
			return newInfo;
		}
	}
}
