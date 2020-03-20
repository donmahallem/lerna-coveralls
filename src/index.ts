/*!
 * Source https://github.com/donmahallem/lerna-coveralls
 */

import * as core from '@actions/core';
import { promiseGlob } from './promise-glob';
import { convertLcovToCoveralls, getOptions, sendToCoveralls, } from './convert-to-lcov';
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

const getPRNumber: () => number | undefined = (): number | undefined => {
    const event: string = readFileSync(process.env.GITHUB_EVENT_PATH || '', 'utf8');
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
        return JSON.parse(event).number;
    } else {
        return undefined;
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

        const cwd: string = path.resolve(process.env.GITHUB_WORKSPACE || process.cwd());
        core.info('Working dir: ' + cwd);
        const lcovFiles: string[] = await promiseGlob(path.join(cwd, './packages/*/coverage/**/lcov.info'));
        if (lcovFiles.length === 0) {
            core.warning('No lcov.info files found');
            return;
        }
        for (const pathToLcov of lcovFiles) {
            const coverageRelativePath: string = path.relative(cwd, pathToLcov);
            const coverageRelativePathParts: string[] = coverageRelativePath.split(path.sep);
            const packageName: string = coverageRelativePathParts[1];
            core.info('Converting: ' + packageName);
            core.info('Cov file: ' + pathToLcov);
            let file: string;
            try {
                file = readFileSync(pathToLcov, 'utf8');
            } catch (err) {
                throw new Error('Lcov file not found.');
            }
            const packageRelativeDir: string = coverageRelativePathParts.slice(0, 2).join(path.sep);
            file.replace('SF:src', 'SF:' + packageRelativeDir + path.sep + 'src');
            console.log(file);
            const p1: string = path.resolve(pathToLcov, cwd);
            const p2: string = path.resolve(cwd);
            console.log(p1, p2, path.relative(p2, p1));
            const coverageWorkingDir: string = path.join(cwd, packageRelativeDir);
            core.info('Use working dir: ' + coverageWorkingDir)
            const coverallsOptions: any = await getOptions({
                filepath: cwd,
                flag_name: packageName,
                parallel: true,
            });
            coverallsOptions.service_job_id = jobId + "_" + packageName;
            coverallsOptions.service_pull_request = getPRNumber();
            coverallsOptions.service_number = jobId;
            core.info("opts" + JSON.stringify(coverallsOptions));
            const covs: any = await convertLcovToCoveralls(file, coverallsOptions);
            console.log(covs);
            const response: any = await sendToCoveralls(covs);
            if (response.statusCode === 200) {
                core.info('Coverage uploaded: ' + response.body)
            } else {
                throw new Error('Coveralls responsed with \'' + response.statusCode + '\'. ' + response.body)
            }
        }

        const payload: any = {
            'payload': { 'build_num': jobId, 'status': 'done' },
            'repo_name': process.env.GITHUB_REPOSITORY,
            'repo_token': githubToken,
        };

        const resp: reqp.FullResponse = await reqp.post({
            body: payload,
            json: true,
            resolveWithFullResponse: true,
            url: `${process.env.COVERALLS_ENDPOINT || 'https://coveralls.io'}/webhook`,
        });
        if (resp.statusCode !== 200) {
            core.setFailed("Coveralls report failed with: " + JSON.stringify(resp.body));
            return;
        } else {
            core.info('Coverage uploaded');
        }
    } catch (error) {
        core.setFailed(error.message);
    }
};

run();
