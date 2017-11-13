export default function() {
	return (
`import { Message } from 'protobufjs';


export interface MessageBase<T> {
	new(values?: Partial<T>, var_args?: string[]): T & Message;
	decode(buffer: ArrayBuffer | ByteBuffer | Buffer | string, length?: number | string, enc?: string): T & Message;
	decodeDelimited(buffer: ByteBuffer | ArrayBuffer | Buffer | string, enc?: string): T & Message;
	decode64(str: string): T & Message;
	decodeHex(str: string): T & Message;
	decodeJSON(str: string): T & Message;
}
`);
}