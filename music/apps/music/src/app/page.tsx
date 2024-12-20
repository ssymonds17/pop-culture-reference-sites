const Page = () => {
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.tailwind file.
   */
  return (
    <div>
      <nav>
        <ul className="flex justify-center">
          <li className="p-2 m-2 border-2">Add Artist</li>
          <li className="p-2 m-2 border-2">Add Album</li>
          <li className="p-2 m-2 border-2">Add Song</li>
          <li className="p-2 m-2 border-2">View Artists</li>
          <li className="p-2 m-2 border-2">View Albums</li>
          <li className="p-2 m-2 border-2">View Songs</li>
        </ul>
      </nav>
      <h1 className="text-4xl font-bold text-center text-gray-900">
        Music Reference Homepage
      </h1>
    </div>
  );
};

export default Page;
