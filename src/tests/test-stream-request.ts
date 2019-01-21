import test from 'ava';
import { v4 as uuid } from 'uuid';
import { Mode } from './gen/Request';
import { callbackAsPromise, timeout, withTestApplication } from './utils';

test('Normal', (t) => withTestApplication(async client => {
	const call = callbackAsPromise(cb => {
		const requestStream = client.streamRequest(null, null, cb);
		for (let i = 0; i < 10; i++) {
			requestStream.write({ id: '', mode: Mode.DEFAULT });
		}
		requestStream.end();
	});

	await t.notThrowsAsync(call);
}))

test('Slow (short timeout should fail)', (t) => withTestApplication(async client => {
	const call = timeout(500, callbackAsPromise(cb => {
		const requestStream = client.streamRequest(null, null, cb);
		for (let i = 0; i < 10; i++) {
			requestStream.write({ id: '', mode: Mode.SLOW });
		}
		requestStream.end();
	}));

	await t.throwsAsync(call);
}))

test('Slow (long timeout should not fail)', (t) => withTestApplication(async client => {
	const call = timeout(1500, callbackAsPromise(async cb => {
		const requestStream = client.streamRequest(null, null, cb);
		for (let i = 0; i < 10; i++) {
			requestStream.write({ id: '', mode: Mode.SLOW });
		}
		requestStream.end();
	}));

	await t.notThrowsAsync(call);
}))

test('Error (should fail)', (t) => withTestApplication(async client => {
	const call = callbackAsPromise(cb => {
		const requestStream = client.streamRequest(null, null, cb);
		for (let i = 0; i < 10; i++) {
			requestStream.write({ id: '', mode: Mode.ERROR });
		}
		requestStream.end();
	});

	await t.throwsAsync(call);
}))

test('Retry (retry 2 times, should fail)', (t) => withTestApplication(async client => {
	const id = uuid();

	for (let i = 0; i < 2; i++) {
		const call = callbackAsPromise(cb => {
			const requestStream = client.streamRequest(null, null, cb);
			requestStream.write({ id: id, mode: Mode.RETRY });
			requestStream.end();
		});

		await t.throwsAsync(call);
	}
}))

test('Retry request(retry 3 times, should not fail)', (t) => withTestApplication(async client => {
	const id = uuid();

	for (let i = 0; i < 3; i++) {
		const call = callbackAsPromise(cb => {
			const requestStream = client.streamRequest(null, null, cb);
			requestStream.write({ id: id, mode: Mode.RETRY });
			requestStream.end();
		});

		if (i < 2) {
			await t.throwsAsync(call);
		} else {
			await t.notThrowsAsync(call);
		}
	}
}))
