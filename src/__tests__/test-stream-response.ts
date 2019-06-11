import test from 'ava';
import { v4 as uuid } from 'uuid';
import { Mode } from './gen/Request';
import { readStreamAsPromise, timeout, withTestApplication } from './utils';

test('Normal', t =>
	withTestApplication(async client => {
		const call = await readStreamAsPromise(client.streamResponse({ id: '', mode: Mode.DEFAULT }));

		t.is(call.length, 3);
	}));

test('Slow (short timeout should fail)', t =>
	withTestApplication(async client => {
		const call = timeout(500, readStreamAsPromise(client.streamResponse({ id: '', mode: Mode.SLOW })));

		await t.throwsAsync(call);
	}));

test('Slow (long timeout should not fail)', t =>
	withTestApplication(async client => {
		const call = timeout(1500, readStreamAsPromise(client.streamResponse({ id: '', mode: Mode.SLOW })));

		await t.notThrowsAsync(call);
	}));

test('Error (should fail)', t =>
	withTestApplication(async client => {
		const call = readStreamAsPromise(client.streamResponse({ id: '', mode: Mode.ERROR }));

		await t.throwsAsync(call);
	}));

test('Retry (retry 2 times, should fail)', t =>
	withTestApplication(async client => {
		const id = uuid();

		for (let i = 0; i < 2; i++) {
			const call = readStreamAsPromise(client.streamResponse({ id: id, mode: Mode.RETRY }));

			await t.throwsAsync(call);
		}
	}));

test('Retry (retry 3 times, should not fail)', t =>
	withTestApplication(async client => {
		const id = uuid();

		for (let i = 0; i < 3; i++) {
			const call = readStreamAsPromise(client.streamResponse({ id: id, mode: Mode.RETRY }));

			if (i < 2) {
				await t.throwsAsync(call);
			} else {
				await t.notThrowsAsync(call);
			}
		}
	}));
