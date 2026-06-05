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
    onClick(item._id);
  };

  if (isArtist(item)) {
    return (
      <button
        key={item._id}
        onClick={handleOnClick}
        className="popover-item text-left"
        type="button"
      >
        <div className="font-medium">{item.displayName}</div>
      </button>
    );
  } else if (isAlbum(item)) {
    return (
      <button
        key={item._id}
        onClick={handleOnClick}
        className="popover-item text-left"
        type="button"
      >
        <div className="font-medium">{item.displayTitle}</div>
        <div className="text-xs text-neutral-500">
          {item.artistDisplayName} • {item.year}
        </div>
      </button>
    );
  } else {
    return <div key="unknown-option" className="popover-item">UNKNOWN OPTION</div>;
  }
};
