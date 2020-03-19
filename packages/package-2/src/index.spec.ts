/*!
 * Source https://github.com/abfluss/abfluss Package: api-client
 */

import { expect } from 'chai';
import 'mocha';
import * as index from './index';

describe('index', (): void => {
    it('should contain FlowApiValidator', (): void => {
        expect(index.FlowApiClient).to.not.equal(false);
    });
});
