import { Context, TemplateFunction } from '../..';
import { fileNameForNamespace, hasTypeOrEnum, recursiveNamespacesOf } from '../utils';
import namespace from './namespace';
import protobufjs6 from './protobufjs6';

export const name = 'protobufjs6';

const template: TemplateFunction = (context: Context) => {
	context.addTemplate('protobufjs6.ts', protobufjs6(context.root));

	recursiveNamespacesOf(context.root).forEach(ns => {
		if (hasTypeOrEnum(ns)) {
			context.addTemplate(fileNameForNamespace(ns), namespace(ns, context.root))
		}
	});
}

export default template;
