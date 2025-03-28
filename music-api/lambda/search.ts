import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { createApiResponse } from './utils';
import { documentClient } from './dynamodb/client';
import { ARTISTS_TABLE_NAME } from './dynamodb/constants';

const handler = async (event: any) => {
  console.log('event', event);
  try {
    const searchString = JSON.parse(event.body.searchString);
    console.log('query', searchString);
    console.log('body', event.body);

    if (!searchString) {
      throw new Error('Missing a searchString parameter');
    }

    const params = {
      TableName: ARTISTS_TABLE_NAME,
      FilterExpression: 'contains(#name, :searchString)',
      ExpressionAttributeNames: {
        '#name': 'name',
      },
      ExpressionAttributeValues: {
        ':searchString': searchString,
      },
    };

    const result = await documentClient.send(new ScanCommand(params));

    if (!result.Items) {
      return createApiResponse(404, {
        message: 'Could not find any matches',
      });
    }

    return createApiResponse(200, {
      artist: result.Items,
      message: 'Successfully retrieved matches',
    });
  } catch (error) {
    if (error instanceof Error) {
      return createApiResponse(404, {
        error: error.message,
      });
    }

    return createApiResponse(502, {
      error: 'An unknown error occurred',
    });
  }
};

export { handler };
