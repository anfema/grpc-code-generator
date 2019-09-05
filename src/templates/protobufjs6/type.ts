import { Root } from 'protobufjs';
import { name } from '.';
import { banner, indent } from '../tags';

export default (root: Root) => indent`
	${banner(name)}

	import {
		Codegen,
		Constructor,
		Field,
		IConversionOptions,
		IToJSONOptions,
		IType,
		Message,
		NamespaceBase,
		OneOf,
		Reader,
		ReflectionObject,
		TypeDecorator,
		Writer
	} from 'protobufjs';

	/** Redefine the protobufjs base type 'Type' to include a generic type parameter 'T' to help type inference. */

	export class Type<T extends object = {}> extends NamespaceBase {
		/**
		 * Constructs a new reflected message type instance.
		 * @param name Message name
		 * @param [options] Declared options
		 */
		constructor(name: string, options?: { [k: string]: any });

		/** Message fields. */
		public fields: { [k: string]: Field };

		/** Oneofs declared within this namespace, if any. */
		public oneofs: { [k: string]: OneOf };

		/** Extension ranges, if any. */
		public extensions: number[][];

		/** Reserved ranges, if any. */
		public reserved: (number[] | string)[];

		/** Message fields by id. */
		public readonly fieldsById: { [k: number]: Field };

		/** Fields of this message as an array for iteration. */
		public readonly fieldsArray: Field[];

		/** Oneofs of this message as an array for iteration. */
		public readonly oneofsArray: OneOf[];

		/**
		 * The registered constructor, if any registered, otherwise a generic constructor.
		 *
		 * Assigning a function replaces the internal constructor. If the function does not extend {@link Message} yet,
		 * its prototype will be setup accordingly and static methods will be populated. If it already extends
		 * {@link Message}, it will just replace the internal constructor.
		 */
		public ctor: Constructor<T>;

		/**
		 * Generates a constructor function for the specified type.
		 * @param mtype Message type
		 * @returns Codegen instance
		 */
		public static generateConstructor<T extends object>(mtype: Type<T>): Codegen;

		/**
		 * Creates a message type from a message type descriptor.
		 * @param name Message name
		 * @param json Message type descriptor
		 * @returns Created message type
		 */
		public static fromJSON<T extends object>(name: string, json: IType): Type<T>;

		/**
		 * Type decorator (TypeScript).
		 * @param [typeName] Type name, defaults to the constructor's name
		 * @returns Decorator function
		 */
		public static d<T extends Message<T>>(typeName?: string): TypeDecorator<T>;

		/**
		 * Converts this message type to a message type descriptor.
		 * @param [toJSONOptions] JSON conversion options
		 * @returns Message type descriptor
		 */
		public toJSON(toJSONOptions?: IToJSONOptions): IType;

		/**
		 * Adds a nested object to this type.
		 * @param object Nested object to add
		 * @returns \`this\`
		 * @throws {TypeError} If arguments are invalid
		 * @throws {Error} If there is already a nested object with this name or, if a field, when there is already a field with this id
		 */
		public add(object: ReflectionObject): Type<T>;

		/**
		 * Removes a nested object from this type.
		 * @param object Nested object to remove
		 * @returns \`this\`
		 * @throws {TypeError} If arguments are invalid
		 * @throws {Error} If \`object\` is not a member of this type
		 */
		public remove(object: ReflectionObject): Type<T>;

		/**
		 * Tests if the specified id is reserved.
		 * @param id Id to test
		 * @returns \`true\` if reserved, otherwise \`false\`
		 */
		public isReservedId(id: number): boolean;

		/**
		 * Tests if the specified name is reserved.
		 * @param name Name to test
		 * @returns \`true\` if reserved, otherwise \`false\`
		 */
		public isReservedName(name: string): boolean;

		/**
		 * Creates a new message of this type using the specified properties.
		 * @param [properties] Properties to set
		 * @returns Message instance
		 */
		public create(properties?: { [k: string]: any }): Message<T> & T;

		/**
		 * Sets up {@link Type#encode|encode}, {@link Type#decode|decode} and {@link Type#verify|verify}.
		 * @returns \`this\`
		 */
		public setup(): Type<T>;

		/**
		 * Encodes a message of this type. Does not implicitly {@link Type#verify|verify} messages.
		 * @param message Message instance or plain object
		 * @param [writer] Writer to encode to
		 * @returns writer
		 */
		public encode(message: (Message<T> | { [k: string]: any }), writer?: Writer): Writer;

		/**
		 * Encodes a message of this type preceeded by its byte length as a varint. Does not implicitly
		 * {@link Type#verify|verify} messages.
		 * @param message Message instance or plain object
		 * @param [writer] Writer to encode to
		 * @returns writer
		 */
		public encodeDelimited(message: (Message<T> | { [k: string]: any }), writer?: Writer): Writer;

		/**
		 * Decodes a message of this type.
		 * @param reader Reader or buffer to decode from
		 * @param [length] Length of the message, if known beforehand
		 * @returns Decoded message
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {util.ProtocolError<{}>} If required fields are missing
		 */
		public decode(reader: (Reader | Uint8Array), length?: number): Message<T> & T;

		/**
		 * Decodes a message of this type preceeded by its byte length as a varint.
		 * @param reader Reader or buffer to decode from
		 * @returns Decoded message
		 * @throws {Error} If the payload is not a reader or valid buffer
		 * @throws {util.ProtocolError} If required fields are missing
		 */
		public decodeDelimited(reader: (Reader | Uint8Array)): Message<T> & T;

		/**
		 * Verifies that field values are valid and that required fields are present.
		 * @param message Plain object to verify
		 * @returns \`null\` if valid, otherwise the reason why it is not
		 */
		public verify(message: { [k: string]: any }): (null | string);

		/**
		 * Creates a new message of this type from a plain object. Also converts values to their respective internal types.
		 * @param object Plain object to convert
		 * @returns Message instance
		 */
		public fromObject(object: { [k: string]: any }): Message<T> & T;

		/**
		 * Creates a plain object from a message of this type. Also converts values to other types if specified.
		 * @param message Message instance
		 * @param [options] Conversion options
		 * @returns Plain object
		 */
		public toObject(message: Message<T>, options?: IConversionOptions): { [k: string]: any };
	}
`;