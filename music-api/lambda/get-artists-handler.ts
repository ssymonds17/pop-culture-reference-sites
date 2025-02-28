import { ARTISTS_TABLE_NAME, documentClient } from '../lib/dynamodb';
import {
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';

const handler = async (event: any) => {
  const params: ScanCommandInput = {
    TableName: ARTISTS_TABLE_NAME,
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
