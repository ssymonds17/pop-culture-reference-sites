import { Album, Artist } from '../../types';
import { SearchResultsOption } from './SearchResultsOption';

export const SearchResultsDisplay = ({
  searchItems,
  setSearchResult,
}: {
  searchItems: Artist[] | Album[];
  setSearchResult: (result: Artist | Album) => void;
}) => {
  const handleOnClick = (id: string) => {
    const selectedId = id;
    const selectedItem = searchItems.find((item) => item._id === selectedId);
    if (!selectedItem) {
      console.error('Selected item not found in search items');
      return;
    }
    setSearchResult(selectedItem);
  };
  return (
    <div className="popover w-full">
      <div className="popover-content">
        {searchItems.map((item) => {
          return (
            <SearchResultsOption
              key={item._id}
              item={item}
              onClick={handleOnClick}
            />
          );
        })}
      </div>
    </div>
  );
};
