import {
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
  DynamoDBDocumentClient,
} from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient());

const handler = async (event: any) => {
  const params: ScanCommandInput = {
    TableName: 'artists',
  };

  try {
    const result: ScanCommandOutput = await documentClient.send(
      new ScanCommand(params)
    );

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        artist: result.Items,
        message: 'Successfully retrieved artists',
      }),
    };
  } catch (error) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ message: 'Could not find artists' }),
    };
  }
};

export { handler };
