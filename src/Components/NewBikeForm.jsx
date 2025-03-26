import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { closeModal } from "../features/modal/modalSlice";
import InputRow from "./InputRow";
import SubmitBtn from "./Buttons/SubmitBtn";
import { addBike, getBikes } from "../features/bike/bikeSlice";

function NewBikeForm() {
  const dispatch = useDispatch();

  const [userInputState, setUserInputState] = useState({ bikeRegNum: "" });

  function handleChange(e) {
    const key = e.target.name;
    const value = e.target.value;
    setUserInputState((prev) => {
      return { ...prev, [key]: value };
    });
  }

  // function to add new bike
  function handleAddNewBike(e) {
    e.preventDefault();
    dispatch(addBike({ bikeRegNum: userInputState.bikeRegNum.toLowerCase() }))
      .unwrap()
      .then((resp) => {
        if (resp) {
          setUserInputState({});
          dispatch(closeModal());
          dispatch(getBikes());
        }
      })
      .catch((error) => {
        console.log("error in adding a new bike!", error);
      });
  }

  return (
    <form
      className="bg-white w-full max-w-[400px] px-10 py-10 pt-14 rounded flex flex-col gap-4 relative"
      onSubmit={handleAddNewBike}
    >
      <button
        className="absolute right-4 top-4 cursor-pointer"
        onClick={() => {
          dispatch(closeModal());
        }}
      >
        close
      </button>

      {/* BIKE REG NUMBER */}
      <InputRow
        name={"bikeRegNum"}
        label={"bike register id"}
        type={"text"}
        handleChange={handleChange}
        value={userInputState?.bikeRegNum}
        required={true}
      />

      <SubmitBtn text={"create a new bike"} />
    </form>
  );
}

export default NewBikeForm;
