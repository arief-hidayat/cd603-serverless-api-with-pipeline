#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ClouddayIcd603Temp0Stack } from '../lib/cloudday-icd603-temp0-stack';

const app = new cdk.App();
new ClouddayIcd603Temp0Stack(app, 'ClouddayIcd603Temp0Stack', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  restResourceName: 'data'
});