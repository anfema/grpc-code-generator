grpc-code-generator
===

A code generator for gRPC `proto` files. Currently contains templates for generating Typescript definitions for the plain callback/streams based API for a modified version of [grpc-node](https://github.com/grpc/grpc-node/pull/84).


Directory layout
---
This project uses a Yarn workspace layout

| Directory      | Description                    |
|----------------|--------------------------------|
|`/main`         | Main NPM package               |
|`/dependencies` | Dependencies as git submodules |


Preparation
---
Init and clone the submodules (shallow init is enough):
```sh
$ git submodule update --init
```

Install dependencies & build project
```sh
$ yarn/npm
```


Running
---
```sh
$ yarn/npm run grpc-code-generator [-o <out_dir>] path/to/main.proto
```


Generated files
---
| File                                   | Content                           |
|----------------------------------------|-----------------------------------|
|`/<package>/index.d.ts`                   | Interfaces for message types        |
|`/<package>/<ServiceName>/grpc-node.d.ts` | Service types for client and server with standard grpc-node interface |
|`/message-base.d.ts`                      | Base message type with improved constructor |
|`/grpc.d.ts`                              | Object with constructor functions for messages and service descriptions (what `grpc.load()` returns) |


Usage
---
Parametrize your grpc-node's `load()` function with the generated type description:

```ts
import { load } from 'grpc';
// Service type description for grpc.load()
import Description from './gen/grpc';

const grpc = load<Description>('src/tests/proto/test.proto');
```

Server side usage:
```ts
class TestService implements TestService {
	unaryCall(call: ServerUnaryCall<Request>, callback: sendUnaryData<Response>): void {
		callback(null, new grpc.Response());
	}

	streamResponse(call: ServerWriteableStream<Request>): void {
		for (let i = 0; i < request.count; i++) {
			call.write(new grpc.Response());
		}
		call.end();
	}

	streamRequest(call: ServerReadableStream<Request>, callback: sendUnaryData<Response>): void {
		call
			.on('data', (data: Request) => {
				/* */
			})
			.on('error', (error) => {
				/* */
			})
			.on('end', () => {
				callback(null, new grpc.Response());
			});
	}

	streamBidi(call: ServerDuplexStream<Request, Response>): void {
		call
			.on('data', (data: Request) => {
				call.write(new grpc.Response());
			})
			.on('error', (error) => {
				/* */
			})
			.on('end', () => {
				call.end();
			});
	}
}

const server = new Server();

server.addService(grpc.TestService.service, new TestService());
server.bind('0.0.0.0:3000', ServerCredentials.createInsecure());
server.start();
```

Client side usage:
```ts
import { credentials } from 'grpc';
// message types
import { Request, Response } from './gen';
// adapter types
import { Client } from './gen/TestService/grpc-node';

const client = new grpc.TestService('0.0.0.0:3000', credentials.createInsecure());

client.unaryCall(new grpc.Request({ mode: 'normal' }), (err, response) => {
	/* */
});

const stream1 = client.streamResponse(new grpc.Request())
	.on('data', (response) => {
		/* */
	})
	.on('error', (error) => {
		/* */
	})
	.on('end', () => {
		/* */
	});

const requestStream = client.streamRequest(cb);
for (let i = 0; i < 10; i++) {
	requestStream.write(new grpc.Request({ mode: 'normal' }));
}
requestStream.end();

const stream = client.streamBidi()
	.on('data', (response) => {
		/* */
	})
	.on('error', (error) => {
		/* */
	})
	.on('end', () => {
		/* */
	});

for (let i = 0; i < 10; i++) {
	stream.write(new grpc.Request({ mode: 'normal' }));
}
// wait for responses, then
stream.end();
```


Development
---
* Build once: `$ yarn/npm run build`
* Build, watch files: `$ yarn/npm run dev`
* Remove generated files: `$ yarn/npm run clean`

Todo
---
