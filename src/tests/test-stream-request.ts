import test from 'ava';
import { v4 as uuid } from 'uuid';
import { createClient } from './client';
import { createServer } from './server';
import { callbackAsPromise, timeout } from './utils';


test('Stream Request | Normal', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	return callbackAsPromise(cb => {
		const requestStream = client.streamRequest(null, null, cb);
		for (let i = 0; i < 10; i++) {
			requestStream.write({
				id: '',
				mode: 'normal',
				count: 0,
			});
		}
		requestStream.end();
	});
});

test('Stream Request | Slow (short timeout should fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	return t.throws(Promise.race([
		timeout(500),
		callbackAsPromise(cb => {
			const requestStream = client.streamRequest(null, null, cb);
			for (let i = 0; i < 10; i++) {
				requestStream.write({
					id: '',
					mode: 'slow',
					count: 0,
				});
			}
			requestStream.end();
		})
	]));
});

test('Stream request | Slow (long timeout should not fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	return Promise.race([
		timeout(1500),
		callbackAsPromise(cb => {
			const requestStream = client.streamRequest(null, null, cb);
			for (let i = 0; i < 10; i++) {
				requestStream.write({
					id: '',
					mode: 'slow',
					count: 0,
				});
			}
			requestStream.end();
		})
	]);
});

test('Stream request | Error (should fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	return t.throws(callbackAsPromise(cb => {
		const requestStream = client.streamRequest(null, null, cb);
		for (let i = 0; i < 10; i++) {
			requestStream.write({
				id: '',
				mode: 'error',
				count: 0,
			});
		}
		requestStream.end();
	}));
});

test('Stream request | Retry (retry 2 times, should fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	t.plan(2);
	const id = uuid();

	for (let i = 0; i < 2; i++) {
		try {
			await callbackAsPromise(cb => {
				const requestStream = client.streamRequest(null, null, cb);
				requestStream.write({
					id: '',
					mode: 'retry',
					count: 0,
				});
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
	const port = await createServer();
	const client = await createClient(port);

	t.plan(3);
	const id = uuid();

	for (let i = 0; i < 3; i++) {
		try {
			await callbackAsPromise(cb => {
				const requestStream = client.streamRequest(null, null, cb);
				requestStream.write({
					id: id,
					mode: 'retry',
					count: 0,
				});
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
