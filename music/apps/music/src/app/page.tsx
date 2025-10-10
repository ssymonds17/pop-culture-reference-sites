const Page = () => {
  return (
    <div className="layout-container">
      <section className="layout-section">
        <div className="layout-header text-center">
          <h1 className="mb-component-sm">
            Music Reference Database
          </h1>
          <p className="text-lg text-neutral-600 max-w-prose mx-auto">
            Discover, organize, and rate your favorite artists, albums, and songs.
            Build your personal music collection with detailed ratings and insights.
          </p>
        </div>

        <div className="layout-grid-3">
          <div className="component-card">
            <h3 className="mb-component-sm">Artists</h3>
            <p className="text-neutral-600">Browse and discover artists with detailed ratings and album collections.</p>
          </div>

          <div className="component-card">
            <h3 className="mb-component-sm">Albums</h3>
            <p className="text-neutral-600">Explore albums with gold and silver ratings, complete with track listings.</p>
          </div>

          <div className="component-card">
            <h3 className="mb-component-sm">Songs</h3>
            <p className="text-neutral-600">Individual tracks with ratings and detailed metadata for your collection.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Page;
