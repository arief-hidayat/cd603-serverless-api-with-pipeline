#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ServerlessApiStack } from '../lib/serverless-api-stack';
import {PipelineStack} from "../lib/pipeline-stack";

const app = new cdk.App();
const env: cdk.Environment = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION }
new ServerlessApiStack(app, 'cd603-serverless-api-dev', {
  env: env,
  restResourceName: 'data',
  stageName: 'dev',
});

new PipelineStack(app, 'cd603-serverless-api-staging-pipeline', {
  env: env,
  git: {
    repo: 'arief-hidayat/cd603-serverless-api-with-pipeline',
    branch: 'main',
    connectionArn: 'git-repo-connection-arn'
  },
  stagingEnv: env,
  // prodEnv: env
})