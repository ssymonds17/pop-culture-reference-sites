import {
  ScanCommand,
  ScanCommandInput,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { createApiResponse } from './utils/api';
import { documentClient } from './dynamodb/client';
import { ARTISTS_TABLE_NAME } from './dynamodb/constants';

const handler = async () => {
  const params: ScanCommandInput = {
    TableName: ARTISTS_TABLE_NAME,
  };

  try {
    const result: ScanCommandOutput = await documentClient.send(
      new ScanCommand(params)
    );

    if (!result.Items) {
      return createApiResponse(404, {
        message: 'Could not find artists',
      });
    }

    return createApiResponse(200, {
      artist: result.Items,
      message: 'Successfully retrieved artists',
    });
  } catch (error) {
    return createApiResponse(404, {
      message: { message: 'Could not find artists' },
    });
  }
};

export { handler };
