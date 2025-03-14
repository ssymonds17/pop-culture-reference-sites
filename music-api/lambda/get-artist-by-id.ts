import {
  GetCommand,
  GetCommandInput,
  GetCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { createApiResponse } from './utils';
import { documentClient } from './dynamodb/client';
import { ARTISTS_TABLE_NAME } from './dynamodb/constants';

const handler = async (event: any) => {
  console.log('Event: ', event);
  const artistId = event.pathParameters?.id;
  const params: GetCommandInput = {
    TableName: ARTISTS_TABLE_NAME,
    Key: { id: artistId },
    ConsistentRead: true,
  };

  try {
    if (!artistId) {
      return createApiResponse(400, {
        message: 'Missing artist ID',
      });
    }

    const result: GetCommandOutput = await documentClient.send(
      new GetCommand(params)
    );

    if (!result.Item) {
      return createApiResponse(404, {
        message: 'Could not find artist',
      });
    }

    return createApiResponse(200, {
      artist: result.Item,
      message: 'Successfully retrieved artist',
    });
  } catch (error) {
    return createApiResponse(404, {
      message: { message: 'Could not find artist' },
    });
  }
};

export { handler };
