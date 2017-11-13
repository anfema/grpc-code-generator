grpc-code-generator
===

A code generator for gRPC `proto` files. Currently contains templates for generating Typescript definitions for the plain callback/streams based API for [grpc-node](https://github.com/grpc/grpc-node).

Prerequisites
---
The grpc-node version from [here](https://github.com/grpc/grpc-node/pull/84).

Usage
---
Add this package to you dev dependencies. Parametrize your grpc-node's `load()` function:
```ts
import { Point, Feature, Rectangle, RouteNote, RouteSummary, RouteGuide } from './grpc-gen/routeguide';
import Grpc from './grpc-gen/grpc';

const routeguide = load<Grpc>(protoPath).routeguide;
```

Server side usage:
```ts
export const server = new Server();

server.addService(routeguide.RouteGuide.service, {
	getFeature(call: ServerUnaryCall<Point>, callback: sendUnaryData<Feature>): void {
		console.log('>> getFeature()');

		callback(null, new routeguide.Feature({
			name: "My location",
			location: call.request
		}));
	},

	// stream from server to client
	listFeatures(call: ServerWriteableStream<Rectangle>): void {
		console.log('>> listFeatures()');

		for (let i = 0; i < 10; i++) {
			call.write(new routeguide.Feature({
				name: `FeatureName-${i}`,
				location: new routeguide.Point({
					latitude: i,
					longitude: i,
				}),
			}))
		}

		call.end();
	},

	// stream from client to server
	recordRoute(call: ServerReadableStream<Point>, callback: sendUnaryData<RouteSummary>): void {
		const points = Array<Point>();

		call.on('data', (data: Point) => {
			console.log('>> recordRoute():', data);
			points.push(data);
		});
		call.on('end', () => {
			callback(null, new routeguide.RouteSummary({
				point_count: points.length,
				feature_count: points.length,
				distance: 12,
				elapsed_time: 120,
			}))
		});
	},

	// stream from client to server and server to client
	routeChat(call: ServerDuplexStream<RouteNote, RouteNote>): void {
		call.on('data', (data) => {
			console.log(">> routeChat() data:");
		});

		for (let i = 0; i < 10; i++) {
			call.write(new routeguide.RouteNote({
				location: new routeguide.Point({
					latitude: Math.round(Math.random() * 180),
					longitude: Math.round(Math.random() * 180),
				}),
				message: `FromServer-${i}`,
			}))
		}
		setTimeout(() => {
			call.end();
		}, 1000);
	}
});
```

Client side usage:
```ts
const client = new routeguide.RouteGuide('0.0.0.0:3001', credentials.createInsecure());

const point1 = new routeguide.Point({
	latitude: 12,
	longitude: 20,
});

const point2 = new routeguide.Point({
	latitude: 12,
	longitude: 14,
});

const rectangle = new routeguide.Rectangle({
	lo: point1,
	hi: point2
});

client.getFeature(point1, (error, reply) => {
	console.log(">> getFeature():", reply);
});

const call = client.listFeatures(rectangle);
call.on('data', (feature: Feature) => {
	console.log(">> listFeatures(): data", feature.name);
});
call.on('end', () => {
	console.log(">> listFeatures(): end");
});

const call2 = client.recordRoute((error, reply) => {
	console.log(">> recordRoute() reply:", reply);
});
for (let i = 0; i < 10; i++) {
	call2.write(new routeguide.Point({
		latitude: Math.round(Math.random() * 180),
		longitude: Math.round(Math.random() * 180),
	}));
}
call2.end();

const call3 = client.routeChat();
call3.on('data', (data) => {
	console.log(">> routeChat() data:");
})
call3.on('end', () => {
	console.log(">> routeChat(): end");
});

for (let i = 0; i < 10; i++) {
	call3.write(new routeguide.RouteNote({
		location: new routeguide.Point({
			latitude: Math.round(Math.random() * 180),
			longitude: Math.round(Math.random() * 180),
		}),
		message: `FromClient-${i}`,
	}))
}
call3.end();
```


Running
---
```sh
$ yarn/npm run grpc-gen-ts [-o <out_dir>] path/to/main.proto
```

Development
---
* Build once: `$ yarn/npm run build`
* Build, watch files: `$ yarn/npm run dev`
* Remove generated files: `$ yarn/npm run clean`

Todo
---
* [ ] handle enums
* [ ] handle nested message types
