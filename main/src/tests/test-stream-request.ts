import test from 'ava';
import { setTimeout } from 'timers';
import { v4 as uuid } from 'uuid';
import { Server, ServerCredentials } from 'grpc';
import { createClient } from './client';
import { createServer } from './server';
import { grpc } from './proto';
import { callbackAsPromise, timeout } from './utils';


const port = createServer();
const client = createClient(port);

test('Stream Request | Normal', async (t) => {
	return callbackAsPromise(cb => {
		const requestStream = client.streamRequest(cb);
		for (let i = 0; i < 10; i++) {
			requestStream.write(new grpc.Request({ mode: 'normal' }));
		}
		requestStream.end();
	});
});

test('Stream Request | Slow (short timeout should fail)', (t) => {
	return t.throws(Promise.race([
		timeout(500),
		callbackAsPromise(cb => {
			const requestStream = client.streamRequest(cb);
			for (let i = 0; i < 10; i++) {
				requestStream.write(new grpc.Request({ mode: 'slow' }));
			}
			requestStream.end();
		})
	]));
});

test('Stream request | Slow (long timeout should not fail)', (t) => {
	return Promise.race([
		timeout(1500),
		callbackAsPromise(cb => {
			const requestStream = client.streamRequest(cb);
			for (let i = 0; i < 10; i++) {
				requestStream.write(new grpc.Request({ mode: 'slow' }));
			}
			requestStream.end();
		})
	]);
});

test('Stream request | Error (should fail)', (t) => {
	return t.throws(callbackAsPromise(cb => {
		const requestStream = client.streamRequest(cb);
		for (let i = 0; i < 10; i++) {
			requestStream.write(new grpc.Request({ mode: 'error' }));
		}
		requestStream.end();
	}));
});

test('Stream request | Retry (retry 2 times, should fail)', async (t) => {
	t.plan(2);
	const id = uuid();

	for (let i = 0; i < 2; i++) {
		try {
			await callbackAsPromise(cb => {
				const requestStream = client.streamRequest(cb);
				requestStream.write(new grpc.Request({ mode: 'retry' }));
				requestStream.end();
			});
			t.fail();
		}
		catch (err) {
			t.pass();
		}
	}
});

test('Stream request | Retry request(retry 3 times, should not fail)', async (t) => {
	t.plan(3);
	const id = uuid();

	for (let i = 0; i < 3; i++) {
		try {
			await callbackAsPromise(cb => {
				const requestStream = client.streamRequest(cb);
				requestStream.write(new grpc.Request({ mode: 'retry', id: id }));
				requestStream.end();
			});

			if (i === 2) {
				t.pass();
			}
			else {
				t.fail();
			}
		}
		catch (err) {
			if (i < 2) {
				t.pass();
			}
			else {
				t.fail();
			}
		}
	}
});
