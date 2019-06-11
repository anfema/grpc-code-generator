export const banner = (templateName: string) => indent`
	/*
	This file was automatically generated by @anfema/grpc-code-generator 
	(https://github.com/anfema/grpc-code-generator)
	on ${new Date().toString()}.

	Template: ${templateName}

	- Do not edit this file
	- Do not check this file into version control
	*/
`;

export function indent(strings: TemplateStringsArray, ...values: any[]): string {
	let str = strings[0];

	for (let i = 1; i < strings.length; i++) {
		const indentBeforeValue = strings[i - 1].match(/.+$/g);

		if (indentBeforeValue) {
			values[i - 1] = values[i - 1].replace(/\n/g, `\n${indentBeforeValue[0]}`);
		}

		str = str + values[i - 1] + strings[i];
	}

	// Remove empty lines from the beginning and end
	str = str.replace(/^\s*\n|\s+$/g, '');
	// Remove initial indent on all lines
	const firstLineIndent = str.match(/^\s*/);
	if (firstLineIndent) {
		str = str.replace(new RegExp(`^${firstLineIndent[0]}`, 'gm'), '');
	}

	return str;
}