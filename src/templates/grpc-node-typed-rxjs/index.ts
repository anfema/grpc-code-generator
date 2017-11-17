import * as path from 'path';
import { Root, ReflectionObject, NamespaceBase, Namespace, Type, Service } from 'protobufjs'
import { parentChainOf, allNamespacesTransitiveOf } from '../utils';
import { TemplateFunction, TemplateMap } from '../..';
// import implementation from './implementation';
// import messageBase from './message-base';
// import namespace from './namespace';


// export default function (templateMap: TemplateMap, root: Root): void {
// 	templateMap
// 		.addTemplate('grpc.d.ts', implementation(root))
// 		.addTemplate('message-base.d.ts', messageBase());

// 	allNamespacesTransitiveOf(root).forEach(ns => {
// 		templateMap.addTemplate(fileNameForNamespace(ns), namespace(ns, root))
// 	});
// }


// interface NewServerApi {
// 	getFeature(request: Point): Promise<Feature>;
// 	listFeatures(request: Rectangle): Promsie<Observable<Feature>>;
// 	recordRoute(requestStream: Observable<Point>): Promise<RouteSummary>;
// 	routeChat(requestStream: Observable<RouteNote>): Promise<Observable<RouteNote>>;
// }

// interface NewClientApi {
// 	getFeature(request: Point): ObservableClientCall<Feature>;
// 	listFeatures(request: Rectangle): ObservableClientCall<Feature>;
// 	recordRoute(requestStream: Observable<Point>): ObservableClientCall<RouteSummary>;
// 	routeChat(requestStream: Observable<RouteNote>): ObservableClientCall<RouteNote>;
// }