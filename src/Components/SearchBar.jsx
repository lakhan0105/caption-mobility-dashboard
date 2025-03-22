import React, { useState } from "react";

function SearchBar({ handleSearch, placeHolder }) {
  const [inputText, setInputText] = useState("");

  function handleChange(e) {
    setInputText(e.target.value);
  }

  return (
    <div className="flex items-start h-[30px]">
      <input
        className="px-1.5 text-xs w-[200px] h-full rounded-l-sm text-black outline-none"
        type="text"
        id="search"
        placeholder={placeHolder}
        onChange={handleChange}
        value={inputText}
      />

      <button
        type="submit"
        className="px-3 h-full bg-blue-500 text-xs font-medium rounded-r-sm uppercase"
        onClick={() => {
          handleSearch(inputText);
        }}
      >
        search
      </button>
    </div>
  );
}

export default SearchBar;
