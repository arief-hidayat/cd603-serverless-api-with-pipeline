import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cicd from 'aws-cdk-lib/pipelines';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import {ServerlessApiStack} from "./serverless-api-stack";
import {pipelines} from "aws-cdk-lib";

interface PipelineStackProps extends cdk.StackProps {
  git: GitSource,
  stagingEnv: cdk.Environment,
  // set prodEnv if you would like to deploy to production after staging app passed integration test
  prodEnv?: cdk.Environment
}
interface GitSource {
  repo: string,
  branch: string,
  // CONN_ARN=$(aws codestar-connections create-connection --provider-type GitHub --connection-name arief-hidayat-github --output json | jq -r .ConnectionArn)
  // update pending connection (must be from AWS console)
  // aws ssm put-parameter --name git-repo-connection-arn --value $CONN_ARN --type String
  connectionArnSsmParam: string
}

class TargetApplication extends cdk.Stage {
  outputApiEndpoint: cdk.CfnOutput
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);
    const app = new ServerlessApiStack(this, id, {
      restResourceName: 'data', stageName: id
    })
    this.outputApiEndpoint = app.outputApiEndpoint
  }
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);
    const serverlessApiPipeline = new cicd.CodePipeline(this, 'serverless-api-cicd', {
      synth: new cicd.ShellStep('synth', {
        input: this.createCodepipelineSrcConnection(props.git),
        commands: [
            "npm install -g aws-cdk-lib",
            `cdk synth ${id}`,
        ],
        primaryOutputDirectory: "cdk.out"
      }),
    })
    // staging
    const stagingApp = new TargetApplication(this, "staging", {env: props.stagingEnv})
    serverlessApiPipeline.addStage(stagingApp, {
      post: [
          new cdk.pipelines.ShellStep("Integration Test", {
            envFromCfnOutputs: {
              ENDPOINT_URL: stagingApp.outputApiEndpoint
            },
            commands: ["curl $ENDPOINT_URL/data"]
          })
      ]
    })
    // prod
    if(props.prodEnv) {
      const prodApp = new TargetApplication(this, "prod", {env: props.prodEnv})
      serverlessApiPipeline.addStage(prodApp, {
        pre: [new pipelines.ManualApprovalStep("DeployToProduction")]
      })
    }
  }
  createCodepipelineSrcConnection(git: GitSource): cdk.pipelines.CodePipelineSource {
    const gitConnectionArn = ssm.StringParameter.fromStringParameterName(this, 'git-conn-arn', git.connectionArnSsmParam)
    return cicd.CodePipelineSource.connection(git.repo, git.branch, {
      connectionArn: gitConnectionArn.stringValue
    })
  }
}
