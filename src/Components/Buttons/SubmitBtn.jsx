import { Button } from "@mui/material";
import React from "react";

function SubmitBtn({ text, handleSubmit, disabled }) {
  return (
    <Button
      variant="contained"
      type="submit"
      className={`w-full ${
        disabled ? "bg-blue-300" : "bg-blue-500"
      } text-white text-sm py-2 rounded`}
      onClick={handleSubmit}
      disabled={disabled}
    >
      {text}
    </Button>
  );
}

export default SubmitBtn;
