/*!
 * Source https://github.com/donmahallem/lerna-coveralls
 */

import * as glob from 'glob';
export const promiseGlob: (pattern: string) => Promise<string[]> = (pattern: string): Promise<string[]> => {
    return new Promise<any>((resolve: (matches: string[]) => void, reject: (err?: any) => void): void => {
        glob(pattern, (err: any, files: string[]): void => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
};
