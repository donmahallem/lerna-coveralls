/*!
 * Source https://github.com/donmahallem/lerna-coveralls
 */

import * as coveralls from 'coveralls';
export const convertLcovToCoveralls: (input: string, options: any) => Promise<any> = (input: string, options: any): Promise<any> => {
    return new Promise<any>((resolve: (matches: string[]) => void, reject: (err?: any) => void): void => {
        coveralls.convertLcovToCoveralls(input, options, (err: any, files: any): void => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
};

export const getOptions: (userOptions: any) => Promise<any> = (userOptions: any): Promise<any> => {
    return new Promise<any>((resolve: (matches: string[]) => void, reject: (err?: any) => void): void => {
        coveralls.getOptions((err: any, files: any): void => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        }, userOptions);
    });
};

export const sendToCoveralls: (covData: any) => Promise<any> = (covData: any): Promise<any> => {
    return new Promise<any>((resolve: (matches: string[]) => void, reject: (err?: any) => void): void => {
        coveralls.sendToCoveralls(covData, (err: any, files: any): void => {
            if (err) {
                reject(err);
            } else {
                resolve(files);
            }
        });
    });
};
