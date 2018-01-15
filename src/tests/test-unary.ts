import { setTimeout } from 'timers';
import { promisify } from 'util';
import { v4 as uuid } from 'uuid';
import test from 'ava';
import { Server, ServerCredentials } from 'grpc';
import { createClient } from './client';
import { createServer } from './server';
import { grpc } from './proto';
import { callbackAsPromise, timeout } from './utils';


const port = createServer();
const client = createClient(port);

test('Unary call | normal', (t) => {
	return callbackAsPromise(cb => {
		client.unaryCall({
			id: '',
			mode: 'normal',
			count: 0,
		}, cb)
	});

});

test('Unary call | slow (short timeout should fail)', (t) => {
	return t.throws(Promise.race([
		timeout(500),
		callbackAsPromise(cb => { client.unaryCall({
			id: '',
			mode: 'slow',
			count: 0,
		}, cb) })
	]));
});

test('Unary call | slow (long timeout should not fail)', (t) => {
	return Promise.race([
		timeout(1500),
		callbackAsPromise(cb => { client.unaryCall({
			id: '',
			mode: 'slow',
			count: 0,
		}, cb) })
	]);
});

test('Unary call | error (should fail)', (t) => {
	return t.throws(callbackAsPromise(cb => {
		client.unaryCall({
			id: '',
			mode: 'error',
			count: 0,
		}, cb)
	}));
});

test('Unary call | retry (retry 2 times, should fail)', async (t) => {
	t.plan(2);

	const id = uuid();

	for (let i = 0; i < 2; i++) {
		try {
			await callbackAsPromise(cb => client.unaryCall({
				id: id,
				mode: 'retry',
				count: 0,
			}, cb));
			t.fail();
		}
		catch (err) {
			t.pass();
		}
	}
});

test('Unary call | retry (retry 3 times, should not fail)', async (t) => {
	t.plan(3);

	const id = uuid();

	for (let i = 0; i < 3; i++) {
		try {
			await callbackAsPromise(cb => client.unaryCall({
				id: id,
				mode: 'retry',
				count: 0,
			}, cb));

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
