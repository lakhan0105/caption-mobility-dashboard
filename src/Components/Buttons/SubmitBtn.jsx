import React from "react";

function SubmitBtn({ text, handleSubmit }) {
  return (
    <button
      type="submit"
      className="w-full bg-blue-500 text-white text-sm py-2 rounded"
      onClick={handleSubmit}
    >
      {text}
    </button>
  );
}

export default SubmitBtn;
