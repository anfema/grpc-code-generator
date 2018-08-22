import * as path from 'path';
import { load } from 'grpc';
import Description from './gen/grpc-node';


const protoPath = path.join(process.cwd(), 'src', 'tests', 'proto', 'test.proto');
export const grpc = load<Description>(protoPath);

