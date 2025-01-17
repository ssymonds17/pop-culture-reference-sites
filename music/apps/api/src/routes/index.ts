const { Router } = require('express');
import { artistsRouter } from './artists';
const apiRouter = Router();

apiRouter.use('/artists', artistsRouter);

/*
ARTISTS

1. GET artist by id
2. GET artists by name (return all matching results)
3. POST create an artist
4. PATCH update an artist
5. DELETE an artist

type = {
    id: string;
    name: string;
}

ALBUMS

1. GET album by id
2. GET albums by name (return all matching results)
3. GET top albums (either has 6 songs or is gold starred)
4. POST create an album
5. PATCH update an album (e.g. add gold star)
6. DELETE an album

type = {
    id: string;
    title: string;
    year: number;
    artist: { 
        id: string;
        name: string;
    }[];
    songs: {
    id: string;
    name: string;
    }[];
    artistDisplayName: string;
}

SONGS
1. GET song by id
2. GET song by name (return all matching results)
3. POST create a song
4. PATCH update a song
5. DELETE a song

type = {
    id: string;
    title: string;
    year: number;
    artist: { 
        id: string;
        name: string;
    }[];
    albumId: {
        id: string;
        title: string
    };
    artistDisplayName: string;
}
*/

module.exports = {
  apiRouter,
};
