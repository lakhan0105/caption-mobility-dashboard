import React from "react";

function InputRow({
  name,
  type,
  label,
  handleChange,
  value,
  required,
  children,
}) {
  return (
    <div className="flex flex-col items-start mb-0">
      <label htmlFor={name} className="capitalize mb-2">
        {label}
      </label>

      {children}

      <input
        type={type}
        name={name}
        id={name}
        className="w-full px-1 h-[35px] border border-[#808000]/20 rounded text-sm"
        value={value}
        onChange={handleChange}
        required={required}
      />
    </div>
  );
}

export default InputRow;
