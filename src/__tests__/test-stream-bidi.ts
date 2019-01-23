import test from 'ava';
import { v4 as uuid } from 'uuid';
import { Mode } from './gen/Request';
import { readStreamAsPromise, timeout, withTestApplication } from './utils';

test('Normal', (t) => withTestApplication(async client => {
	const stream = client.streamBidi();

	for (let i = 0; i < 10; i++) {
		stream.write({ id: '', mode: Mode.DEFAULT });
	}
	stream.end();

	await t.notThrowsAsync(readStreamAsPromise(stream));
}))

test('Slow (short timeout should fail)', (t) => withTestApplication(async client => {
	const stream = client.streamBidi();

	for (let i = 0; i < 10; i++) {
		stream.write({ id: '', mode: Mode.SLOW });
	}
	stream.end();

	await t.throwsAsync(timeout(500, readStreamAsPromise(stream)));
}))

test('Slow (long timeout should not fail)', (t) => withTestApplication(async client => {
	const stream = client.streamBidi();

	for (let i = 0; i < 10; i++) {
		stream.write({ id: '', mode: Mode.SLOW });
	}
	stream.end();

	await t.notThrowsAsync(timeout(1500, readStreamAsPromise(stream)));
}))

test('Error (should fail)', (t) => withTestApplication(async client => {
	const stream = client.streamBidi();

	for (let i = 0; i < 10; i++) {
		stream.write({ id: '', mode: Mode.ERROR });
	}
	stream.end();

	await t.throwsAsync(readStreamAsPromise(stream));
}))

test('Retry (retry 2 times, should fail)', (t) => withTestApplication(async client => {
	const id = uuid();

	for (let i = 0; i < 2; i++) {
		const stream = client.streamBidi();
		stream.write({ id: id, mode: Mode.RETRY });
		stream.end();

		await t.throwsAsync(readStreamAsPromise(stream));
	}
}))

test('Retry request(retry 3 times, should not fail)', (t) => withTestApplication(async client => {
	const id = uuid();

	for (let i = 0; i < 3; i++) {
		const stream = client.streamBidi();
		stream.write({ id: id, mode: Mode.RETRY });
		stream.end();

		if (i < 2) {
			await t.throwsAsync(readStreamAsPromise(stream));
		} else {
			await t.notThrowsAsync(readStreamAsPromise(stream));
		}
	}
}))
