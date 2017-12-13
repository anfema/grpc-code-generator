import test from 'ava';
import { setTimeout } from 'timers';
import { Readable } from 'stream';
import { v4 as uuid } from 'uuid';
import { Server, ServerCredentials } from 'grpc';
import { createClient } from './client';
import { createServer } from './server';
import { grpc } from './proto';
import { callbackAsPromise, timeout, readStreamAsPromise } from './utils';


const port = createServer();
const client = createClient(port);



test('Stream response | Normal', async (t) => {
	const response = await readStreamAsPromise(
		client.streamResponse(new grpc.Request({ mode: 'normal', count: 4 }))
	);

	t.is(response.length, 4);
});

test('Stream response | Slow (short timeout should fail)', (t) => {
	return t.throws(Promise.race([
		timeout(500),
		readStreamAsPromise(
			client.streamResponse(new grpc.Request({ mode: 'slow', count: 4 }))
		)
	]));
});

test('Stream response | Slow (long timeout should not fail)', (t) => {
	return Promise.race([
		timeout(1500),
		readStreamAsPromise(
			client.streamResponse(new grpc.Request({ mode: 'slow', count: 4 }))
		)
	]);
});

test('Stream response | Error (should fail)', (t) => {
	return t.throws(readStreamAsPromise(
		client.streamResponse(new grpc.Request({ mode: 'error' }))
	));
});

test('Stream response | Retry (retry 2 times, should fail)', async (t) => {
	t.plan(2);
	const id = uuid();

	for (let i = 0; i < 2; i++) {
		try {
			await readStreamAsPromise(client.streamResponse(new grpc.Request({
				id: id,
				mode: 'retry'
			})));

			t.fail();
		}
		catch (err) {
			t.pass();
		}
	}
});

test('Stream response | Retry (retry 3 times, should not fail)', async (t) => {
	t.plan(3);
	const id = uuid();

	for (let i = 0; i < 3; i++) {
		try {
			await readStreamAsPromise(client.streamResponse(new grpc.Request({
				id: id,
				mode: 'retry'
			})));

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
