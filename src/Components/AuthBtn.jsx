import React from "react";
// this component renders a button element

function AuthBtn({ text, extraStyles, name, authBtnHandler, type, disabled }) {
  return (
    <button
      className={`px-6 py-1.5 hover:bg-green-700 ${extraStyles} transition-all`}
      onClick={(e) => {
        e.preventDefault();
        authBtnHandler(name);
      }}
      type={type}
      disabled={disabled}
    >
      {text}
    </button>
  );
}

export default AuthBtn;
