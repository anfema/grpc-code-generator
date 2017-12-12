import * as path from 'path';
import { load } from 'grpc';
import Description from '../gen/grpc';


const protoPath = path.join(process.cwd(), 'src', 'tests', 'proto', 'test.proto');
export const grpc = load<Description>(protoPath);

