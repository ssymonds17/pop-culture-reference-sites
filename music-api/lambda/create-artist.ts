import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { v7 as uuidV7 } from 'uuid';
import { createApiResponse } from './utils';
import { documentClient } from './dynamodb/client';
import { ARTISTS_TABLE_NAME } from './dynamodb/constants';

const handler = async (event: any) => {
  const artistName = JSON.parse(event.body).name;
  try {
    if (!artistName) {
      throw new Error('Artist name is required');
    }

    const artistId = uuidV7();
    const defaultArtist = {
      id: artistId,
      name: artistName,
      albums: [],
      songs: [],
      silverAlbums: 0,
      goldAlbums: 0,
      totalSongs: 0,
      totalScore: 0,
    };
    await documentClient.send(
      new PutCommand({
        TableName: ARTISTS_TABLE_NAME,
        Item: defaultArtist,
        ConditionExpression: 'attribute_not_exists(id)',
      })
    );

    return createApiResponse(201, {
      id: artistId,
      artistName,
      message: 'Successfully created artist',
    });
  } catch (error) {
    return createApiResponse(502, {
      message: { message: 'Could not create artist' },
    });
  }
};

export { handler };
