interface Song {
  id: string; // unique id of the song
  title: string; // title of the song
  album?: Album; // {optional} the album the song was released on
  artists: Artist[]; // the artists present on the song
}

export type Rating = 'GOLD' | 'SILVER' | 'NONE';

interface Album {
  id: string; // unique id of the album
  title: string; // title of the album
  artistDisplayName: string; // the display name of the artist of the album
  artists: Artist[]; // the artists who should be credited with this album
  songs: Song[]; // the songs on the album
  rating: Rating; // what is the rating of the album (if applicable)
}

interface Artist {
  id: string; // unique id of the artist
  name: string; // the name of the artist
  albums: Album[]; // the albums of the artist
  songs: Song[]; // the songs of the artist
  silverAlbums: number; // how many silver rated albums this artist has
  goldAlbums: number; // how many gold rated albums this artist has
  totalSongs: number; // how many songs this artist has
  totalScore: number; // the total score for this artist
}
