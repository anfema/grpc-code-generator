import test from 'ava';
import { v4 as uuid } from 'uuid';
import { createClient } from './client';
import { createServer } from './server';
import { readStreamAsPromise, timeout } from './utils';


test('Stream response | Normal', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	const response = await readStreamAsPromise(
		client.streamResponse({
			id: '',
			mode: 'normal',
			count: 4
		})
	);

	t.is(response.length, 4);
});

test('Stream response | Slow (short timeout should fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	await t.throwsAsync(Promise.race([
		timeout(500),
		readStreamAsPromise(
			client.streamResponse({
				id: '',
				mode: 'slow',
				count: 4
			})
		)
	]));
});

test('Stream response | Slow (long timeout should not fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	await Promise.race([
		timeout(1500),
		readStreamAsPromise(
			client.streamResponse({
				id: '',
				mode: 'slow',
				count: 4
			})
		)
	]);
});

test('Stream response | Error (should fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	await t.throwsAsync(readStreamAsPromise(
		client.streamResponse({
			id: '',
			mode: 'error',
			count: 0,
		})
	));
});

test('Stream response | Retry (retry 2 times, should fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	t.plan(2);
	const id = uuid();

	for (let i = 0; i < 2; i++) {
		try {
			await readStreamAsPromise(client.streamResponse({
				id: id,
				mode: 'retry',
				count: 0,
			}));

			t.fail();
		}
		catch (err) {
			t.pass();
		}
	}
});

test('Stream response | Retry (retry 3 times, should not fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	t.plan(3);
	const id = uuid();

	for (let i = 0; i < 3; i++) {
		try {
			await readStreamAsPromise(client.streamResponse({
				id: id,
				mode: 'retry',
				count: 0,
			}));

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
