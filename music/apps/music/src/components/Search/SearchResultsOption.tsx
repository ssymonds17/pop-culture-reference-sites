import { Album, Artist } from '../../types';

export const SearchResultsOption = ({
  item,
  onClick,
}: {
  item: Artist | Album;
  onClick: (id: string) => void;
}) => {
  const isArtist = (item: any): item is Artist => 'name' in item;
  const isAlbum = (item: any): item is Album => 'title' in item;

  const handleOnClick = () => {
    onClick(item.id);
  };

  if (isArtist(item)) {
    return (
      <div
        key={item.id}
        onClick={handleOnClick}
        className="cursor-pointer hover:bg-gray-200"
      >
        {item.displayName}
      </div>
    );
  } else if (isAlbum(item)) {
    return (
      <div
        key={item.id}
        onClick={handleOnClick}
        className="cursor-pointer hover:bg-gray-200"
      >
        {item.displayTitle} - {item.artistDisplayName} ({item.year})
      </div>
    );
  } else {
    return <div key="unknown-option">UNKNOWN OPTION</div>;
  }
};
