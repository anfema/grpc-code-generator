import test from 'ava';
import { v4 as uuid } from 'uuid';
import { createClient } from './client';
import { createServer } from './server';
import { readStreamAsPromise, timeout } from './utils';

test('BiDi response | Normal', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	const stream = client.streamBidi();

	for (let i = 0; i < 10; i++) {
		stream.write({
			id: '',
			mode: 'normal',
			count: 0,
		});
	}
	stream.end();

	return readStreamAsPromise(stream);

});

test('Bidi response | Slow (short timeout should fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	const stream = client.streamBidi();

	for (let i = 0; i < 10; i++) {
		stream.write({
			id: '',
			mode: 'slow',
			count: 0,
		});
	}
	stream.end();

	return t.throws(Promise.race([
		timeout(500),
		readStreamAsPromise(stream)
	]));
});

test('BiDi response | Slow (long timeout should not fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	const stream = client.streamBidi();

	for (let i = 0; i < 10; i++) {
		stream.write({
			id: '',
			mode: 'slow',
			count: 0,
		});
	}
	stream.end();

	return Promise.race([
		timeout(1500),
		readStreamAsPromise(stream)
	]);
});

test('BiDi response | Error (should fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	const stream = client.streamBidi();

	for (let i = 0; i < 10; i++) {
		stream.write({
			id: '',
			mode: 'error',
			count: 0,
		});
	}
	stream.end();

	return t.throws(readStreamAsPromise(stream));
});

test('BiDi response | Retry (retry 2 times, should fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	t.plan(2);

	const id = uuid();

	for (let i = 0; i < 2; i++) {
		try {
			const stream = client.streamBidi();
			stream.write({
				id: '',
				mode: 'retry',
				count: 0,
			});
			stream.end();

			await readStreamAsPromise(stream)

			t.fail();
		}
		catch (err) {
			t.pass();
		}
	}
});

test('Stream response | Retry request(retry 3 times, should not fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	t.plan(3);

	const id = uuid();

	for (let i = 0; i < 3; i++) {
		try {
			const stream = client.streamBidi();
			stream.write({
				id: id,
				mode: 'retry',
				count: 0,
			});
			stream.end();
			await readStreamAsPromise(stream)

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
