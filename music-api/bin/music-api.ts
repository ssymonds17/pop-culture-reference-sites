#!/usr/bin/env node
import "source-map-support/register"
import * as cdk from "aws-cdk-lib"
import { ApiStack } from "../lib/api-stack"

const app = new cdk.App()
new ApiStack(app, "MusicApiStack", {
  env: {
    account: "137040371207",
    region: "eu-west-1",
  },
})
