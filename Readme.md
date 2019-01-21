grpc-code-generator
===

A code generator for gRPC/protobuf `.proto` files. Contains templates for generating Typescript definitions for the plain callback/streams based API for [grpc-node](https://github.com/grpc/grpc-node) and protobuf message types.


Running
---
```sh
$ yarn/npm run grpc-code-generator [options] path/to/main.proto [path/to/another.proto]
```

Options can be specified on the command line or in a config file. If both are present, the command line options take precedence.

Options:
```
-o  --out <out_dir>

    Output directory (default: src-gen/)

-I  --proto_path <include_dir>     
	
    Root path for resolving imports (may be specified multiple times, default: current working dir)

-t  --templates <template1> [<template2> …]

    Path to template modules used for generating code (default: builtin templates)

-c  --config <file>

    Path to JSON config file.
```

Config file
```
{
	"out": "<out_dir>",
	"proto_paths": [
		"<dir1>",
		"<dir2>"
	],
	"files": [
		"path/to/main.proto",
		"path/to/another.proto",
	]
}
```

Generated files
---
| File                                     | Content                           |
|------------------------------------------|-----------------------------------|
|`/<package>/index.d.ts`                   | Interfaces for message types        |
|`/<package>/<ServiceName>/grpc-node.d.ts` | Client/server typings with standard grpc-node interface |
|`/message-base.d.ts`                      | Base message type with constructor |
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

// unary request
client.unaryCall(new grpc.Request({ mode: 'normal' }), (err, response) => {
	/* */
});

// streaming response
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

// streaming request
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
Getting the sources
```sh
$ git clone https://github.com/anfema/grpc-code-generator.git
# or
$ git clone git@github.com:anfema/grpc-code-generator.git
```

Install dependencies & build project
```sh
$ yarn
#or 
$ npm
```

Tasks:
* Build once: `$ yarn/npm run build`
* Build, watch files: `$ yarn/npm run dev`
* Remove generated files: `$ yarn/npm run clean`
