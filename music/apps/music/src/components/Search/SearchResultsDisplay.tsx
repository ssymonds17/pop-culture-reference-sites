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
    const selectedItem = searchItems.find((item) => item.id === selectedId);
    if (!selectedItem) {
      console.error('Selected item not found in search items');
      return;
    }
    setSearchResult(selectedItem);
  };
  return (
    <div className="border-2 w-full">
      {searchItems.map((item) => {
        return (
          <SearchResultsOption
            key={item.id}
            item={item}
            onClick={handleOnClick}
          />
        );
      })}
    </div>
  );
};
