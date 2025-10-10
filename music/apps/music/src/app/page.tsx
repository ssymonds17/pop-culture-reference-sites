const Page = () => {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <h1 className="mb-4">
          Music Reference Database
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
          Discover, organize, and rate your favorite artists, albums, and songs.
          Build your personal music collection with detailed ratings and insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-neutral-200">
          <h3 className="mb-2">Artists</h3>
          <p className="text-neutral-600">Browse and discover artists with detailed ratings and album collections.</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-neutral-200">
          <h3 className="mb-2">Albums</h3>
          <p className="text-neutral-600">Explore albums with gold and silver ratings, complete with track listings.</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-neutral-200">
          <h3 className="mb-2">Songs</h3>
          <p className="text-neutral-600">Individual tracks with ratings and detailed metadata for your collection.</p>
        </div>
      </div>
    </div>
  );
};

export default Page;
