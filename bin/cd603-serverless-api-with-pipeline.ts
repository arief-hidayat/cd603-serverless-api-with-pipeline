#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ServerlessApiStack } from '../lib/serverless-api-stack';
import {PipelineStack} from "../lib/pipeline-stack";

const app = new cdk.App();
new ServerlessApiStack(app, 'api-dev', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  restResourceName: 'data',
  stageName: 'dev',
});

new PipelineStack(app, 'pipeline', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-southeast-1' },
  git: {
    repo: 'arief-hidayat/cd603-serverless-api-with-pipeline',
    branch: 'main',
    connectionArnSsmParam: 'git-repo-connection-arn'
  },
  stagingEnv: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-southeast-3' },
  // prodEnv: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'ap-southeast-3' },
})