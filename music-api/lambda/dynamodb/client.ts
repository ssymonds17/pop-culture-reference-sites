import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient());
