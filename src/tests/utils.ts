import { setTimeout } from "timers";
import { ClientReadableStream } from "grpc";

export function callbackAsPromise(fn: (callback: (error: any, data: any) => void) => void): Promise<void> {
	return new Promise((resolve, reject) => {
		fn((error, data) => {
			if (error) {
				reject(error);
			}
			else if (data) {
				resolve(data)
			}
		});
	})
}

export function sleep(timeoutMs: number): Promise<void> {
	return new Promise((resolve, reject) => {
		setTimeout(() => { resolve(); }, timeoutMs);
	})
}

export function timeout(timeoutMs: number, ...promises: Promise<any>[]): Promise<any> {
	return Promise.race([
		...promises,
		new Promise((resolve, reject) => {
			setTimeout(() => { reject(new Error(`Timeout after ${timeoutMs} ms`)); }, timeoutMs);
		})
	])
}

export function readStreamAsPromise<T>(stream: ClientReadableStream<T>): Promise<T[]> {
	return new Promise((resolve, reject) => {
		const data: T[] = [];

		stream
			.on('data', (response: T) => {
				data.push(response);
			})
			.on('error', (error) => {
				reject(error);
			})
			.on('end', () => {
				resolve(data);
			});
	});
}
