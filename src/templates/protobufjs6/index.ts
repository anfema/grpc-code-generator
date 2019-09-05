import { Root } from 'protobufjs';
import { RenderedTemplatesMap } from '../..';
import { fileNameForNamespace, hasTypeOrEnum, recursiveNamespacesOf } from '../utils';
import namespace from './namespace';
import protobufjs6 from './protobufjs6';
import type from './type';

export const name = 'protobufjs6';

export default function(root: Root): RenderedTemplatesMap {
	const templates = new Map<string, string>();

	templates.set('protobufjs6.d.ts', protobufjs6(root));
	templates.set('protobufjs6-type.d.ts', type(root));

	recursiveNamespacesOf(root).forEach(ns => {
		if (hasTypeOrEnum(ns)) {
			templates.set(fileNameForNamespace(ns), namespace(ns, root));
		}
	});

	return templates;
};
