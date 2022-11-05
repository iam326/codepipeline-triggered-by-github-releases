import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as codeBuild from 'aws-cdk-lib/aws-codebuild';
import * as codePipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codePipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';

export interface CodepipelineTriggeredByGithubReleaseStackProps
  extends cdk.StackProps {
  projectName: string;
  githubOwnerName: string;
  githubRepositoryName: string;
  githubBranchName: string;
  githubTokenName: string;
}

export class CodepipelineTriggeredByGithubReleasesStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: CodepipelineTriggeredByGithubReleaseStackProps
  ) {
    super(scope, id, props);

    const {
      projectName,
      githubOwnerName,
      githubRepositoryName,
      githubBranchName,
      githubTokenName,
    } = props;

    const githubToken =
      cdk.SecretValue.secretsManager(githubTokenName).unsafeUnwrap();

    const sourceArtifact = new codePipeline.Artifact();

    const codeBuildDeployProject = new codeBuild.PipelineProject(
      this,
      'CodeBuildDeployProject',
      {
        projectName: `${projectName}-deploy-project`,
        buildSpec: codeBuild.BuildSpec.fromSourceFilename('./buildspec.yml'),
      }
    );

    const sourceAction = new codePipelineActions.GitHubSourceAction({
      actionName: 'source',
      owner: githubOwnerName,
      repo: githubRepositoryName,
      branch: githubBranchName,
      oauthToken: new cdk.SecretValue(githubToken),
      output: sourceArtifact,
    });

    const deployAction = new codePipelineActions.CodeBuildAction({
      actionName: 'deploy',
      project: codeBuildDeployProject,
      input: sourceArtifact,
    });

    const deployPipeline = new codePipeline.Pipeline(this, 'DeployPipeline', {
      pipelineName: `${projectName}-deploy-pipeline`,
      stages: [
        {
          stageName: 'source',
          actions: [sourceAction],
        },
        {
          stageName: 'deploy',
          actions: [deployAction],
        },
      ],
    });
  }
}
