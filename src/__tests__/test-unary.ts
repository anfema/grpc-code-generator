import test from 'ava';
import { v4 as uuid } from 'uuid';
import { Mode } from './gen/Request';
import { callbackAsPromise, timeout, withTestApplication } from './utils';
import { Response } from './gen';

test('Normal', t =>
	withTestApplication(async client => {
		const id = uuid();
		const call = await callbackAsPromise<Response>(cb =>
			client.unaryCall({ id: id, mode: Mode.DEFAULT }, null, null, cb),
		);

		await t.is(call.id, id);
	}));

test('Slow (short timeout should fail)', t =>
	withTestApplication(async client => {
		const id = uuid();
		const call = timeout(
			500,
			callbackAsPromise(cb => client.unaryCall({ id: id, mode: Mode.SLOW }, null, null, cb)),
		);

		await t.throwsAsync(call);
	}));

test('Slow (long timeout should not fail)', t =>
	withTestApplication(async client => {
		const id = uuid();
		const call = await timeout(
			1500,
			callbackAsPromise<Response>(cb => client.unaryCall({ id: id, mode: Mode.SLOW }, null, null, cb)),
		);

		await t.is(call.id, id);
	}));

test('Error (should fail)', t =>
	withTestApplication(async client => {
		const id = uuid();
		const call = callbackAsPromise(cb => client.unaryCall({ id: id, mode: Mode.ERROR }, null, null, cb));

		await t.throwsAsync(call);
	}));

test('Retry (retry 2 times, should fail)', t =>
	withTestApplication(async client => {
		const id = uuid();

		for (let i = 0; i < 2; i++) {
			const call = callbackAsPromise(cb => client.unaryCall({ id: id, mode: Mode.RETRY }, null, null, cb));

			await t.throwsAsync(call);
		}
	}));

test('Retry (retry 3 times, should not fail)', t =>
	withTestApplication(async client => {
		const id = uuid();

		for (let i = 0; i < 3; i++) {
			const call = callbackAsPromise<Response>(cb =>
				client.unaryCall({ id: id, mode: Mode.RETRY }, null, null, cb),
			);

			if (i < 2) {
				await t.throwsAsync(call);
			} else {
				await t.notThrowsAsync(call);
			}
		}
	}));
