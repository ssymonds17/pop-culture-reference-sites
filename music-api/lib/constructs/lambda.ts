import { Duration, aws_lambda } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

interface LambdaConstructProps {
  functionName: string;
  handler?: string;
  code: aws_lambda.AssetCode;
  timeout?: Duration;
}

export class LambdaConstruct extends Construct {
  public readonly function: lambda.Function;
  public readonly alias: lambda.Alias;

  constructor(
    scope: Construct,
    functionName: string,
    { handler = 'index.handler', code, timeout }: LambdaConstructProps
  ) {
    super(scope, functionName);

    this.function = new lambda.Function(this, functionName, {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler,
      code,
      timeout: timeout,
    });
  }
}
