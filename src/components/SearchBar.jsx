import React, { useState, useRef, useEffect } from 'react';

const SearchBar = ({ initialValue, value: controlledValue, onChange }) => {
  const [value, setValue] = useState('');
  const [isReset, setIsReset] = useState(false);
  const inputRef = useRef(null);

  const handleInputClick = () => {
    setIsReset(true);
    setValue('');
  };

  const handleClickOutside = (event) => {
    if (inputRef.current && !inputRef.current.contains(event.target)) {
      setIsReset(false);
    if (!controlledValue) setValue('');
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <input
      className="p-1.5 border rounded-[4px] w-full searchbar bg-transparent text-[#6b8fa3]"
      ref={inputRef}
      type="text"
      value={controlledValue ?? value}
      placeholder={initialValue}
      onClick={handleInputClick}
      onChange={(e) => {
        setValue(e.target.value);
        onChange?.(e.target.value);
      }}
    />
  );
};

export default SearchBar;
