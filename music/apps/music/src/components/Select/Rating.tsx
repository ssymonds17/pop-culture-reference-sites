export const Rating = () => {
  return (
    <div>
      <label htmlFor="rating">Rating</label>

      <select name="ratings" id="ratings">
        <option value="GOLD">Gold</option>
        <option value="SILVER">Silver</option>
        <option value="NONE">None</option>
      </select>
    </div>
  );
};
