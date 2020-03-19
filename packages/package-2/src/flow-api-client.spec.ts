/*!
 * Source https://github.com/abfluss/abfluss Package: api-client
 */

import { expect } from 'chai';
// if you used the '@types/mocha' method to install mocha type definitions, uncomment the following line
import 'mocha';
import * as flowApiClient from './flow-api-client';

describe('flow-api-client', (): void => {
    describe('FlowApiClient', (): void => {
        describe('constructor()', (): void => {
            it('should construct', (): void => {
                expect(new flowApiClient.FlowApiClient()).to.instanceOf(flowApiClient.FlowApiClient);
            });
        });
    });
});
