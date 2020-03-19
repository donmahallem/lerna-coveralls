/*!
 * Source https://github.com/donmahallem/lerna-coveralls
 */

import * as core from '@actions/core';
import { promiseGlob } from './promise-glob';
import { convertLcovToCoveralls, getOptions, sendToCoveralls } from './convert-to-lcov';
import * as reqp from 'request-promise-native';
import * as path from 'path';
import { readFileSync } from 'fs';

const getJobId: () => string = (): string => {
    // tslint:disable-next-line:triple-equals
    if (process.env.GITHUB_RUN_ID != undefined) {
        return process.env.GITHUB_RUN_ID;
    }
    const sha: string = (process.env.GITHUB_SHA || 'sha').toString();

    const event: string = readFileSync(process.env.GITHUB_EVENT_PATH || '', 'utf8');
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
        const pr: string = JSON.parse(event).number;
        process.env.CI_PULL_REQUEST = pr;
        return `${sha}-PR-${pr}`;
    } else {
        return sha;
    }
}
const run: () => Promise<void> = async (): Promise<void> => {
    try {
        const githubToken: string = core.getInput('github-token');
        process.env.COVERALLS_REPO_TOKEN = githubToken;

        process.env.COVERALLS_SERVICE_NAME = 'github';
        process.env.COVERALLS_GIT_COMMIT = (process.env.GITHUB_SHA || '').toString();
        process.env.COVERALLS_GIT_BRANCH = (process.env.GITHUB_REF || '').toString();


        const jobId: string = getJobId();
        process.env.COVERALLS_SERVICE_JOB_ID = jobId;
        process.env.COVERALLS_SERVICE_NUMBER = jobId;

        const cwd: string = path.resolve('../manniwatch/' || process.env.GITHUB_WORKSPACE || process.cwd());
        core.info('Working dir: ' + cwd);
        const lcovFiles: string[] = await promiseGlob(path.join(cwd, './packages/*/coverage/**/lcov.info'));
        if (lcovFiles.length === 0) {
            core.warning('No lcov.info files found');
            return;
        }
        for (const pathToLcov of lcovFiles) {
            const packageName: string = path.relative(cwd, pathToLcov).split(path.sep)[1];
            core.info('Converting: ' + packageName);
            core.info('Cov file: ' + pathToLcov);
            let file: string;
            try {
                file = readFileSync(pathToLcov, 'utf8');
            } catch (err) {
                throw new Error('Lcov file not found.');
            }
            const p1: string = path.resolve(pathToLcov, cwd);
            const p2: string = path.resolve(cwd);
            console.log(p1, p2, path.relative(p2, p1));

            const coverallsOptions: any = await getOptions({
                filepath: cwd,
                flag_name: packageName,
            });
            const covs: any = await convertLcovToCoveralls(file, coverallsOptions);
            await sendToCoveralls(covs);
        }

        const payload: any = {
            'payload': { 'build_num': jobId, 'status': 'done' },
            'repo_name': process.env.GITHUB_REPOSITORY,
            'repo_token': githubToken,
        };

        const resp: any = await reqp.post({
            body: payload,
            json: true,
            url: `${process.env.COVERALLS_ENDPOINT || 'https://coveralls.io'}/webhook`,
        });
        console.log('resp', resp);
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();
