import test from 'ava';
import { v4 as uuid } from 'uuid';
import { createClient } from './client';
import { createServer } from './server';
import { callbackAsPromise, timeout } from './utils';

test('Unary call | normal', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	await callbackAsPromise(cb => {
		client.unaryCall({
			id: '',
			mode: 'normal',
			count: 0,
		}, null, null, cb)
	});

});

test('Unary call | slow (short timeout should fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	await t.throwsAsync(Promise.race([
		timeout(500),
		callbackAsPromise(cb => { client.unaryCall({
			id: '',
			mode: 'slow',
			count: 0,
		}, null, null, cb) })
	]));
});

test('Unary call | slow (long timeout should not fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	await Promise.race([
		timeout(1500),
		callbackAsPromise(cb => { client.unaryCall({
			id: '',
			mode: 'slow',
			count: 0,
		}, null, null, cb) })
	]);
});

test('Unary call | error (should fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	await t.throwsAsync(callbackAsPromise(cb => {
		client.unaryCall({
			id: '',
			mode: 'error',
			count: 0,
		}, null, null, cb)
	}));
});

test('Unary call | retry (retry 2 times, should fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	t.plan(2);

	const id = uuid();

	for (let i = 0; i < 2; i++) {
		try {
			await callbackAsPromise(cb => client.unaryCall({
				id: id,
				mode: 'retry',
				count: 0,
			}, null, null, cb));
			t.fail();
		}
		catch (err) {
			t.pass();
		}
	}
});

test('Unary call | retry (retry 3 times, should not fail)', async (t) => {
	const port = await createServer();
	const client = await createClient(port);

	t.plan(3);

	const id = uuid();

	for (let i = 0; i < 3; i++) {
		try {
			await callbackAsPromise(cb => client.unaryCall({
				id: id,
				mode: 'retry',
				count: 0,
			}, null, null, cb));

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
