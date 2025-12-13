import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  closeModal,
  hideOptionsModal,
  setOptionsModalPosition,
} from "../features/modal/modalSlice";
import InputRow from "./InputRow";
import SubmitBtn from "./Buttons/SubmitBtn";
import {
  addBike,
  editBikeRegNum,
  getBikes,
  setEditBike,
} from "../features/bike/bikeSlice";
import { IoIosClose } from "react-icons/io";

function NewBikeForm() {
  const { isEditBike, selectedBike } = useSelector(
    (state) => state.bikeReducer
  );

  const dispatch = useDispatch();
  const [userInputState, setUserInputState] = useState({
    bikeRegNum: "",
    bikeModel: "",
  });

  useEffect(() => {
    if (isEditBike && selectedBike) {
      setUserInputState({
        bikeRegNum: selectedBike?.bikeRegNum || "",
        bikeModel: selectedBike?.bikeModel || "",
      });
    }
  }, [isEditBike, selectedBike]);

  function handleChange(e) {
    const key = e.target.name;
    const value = e.target.value;
    setUserInputState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleAddNewBike(e) {
    e.preventDefault();
    dispatch(
      addBike({
        bikeRegNum: userInputState.bikeRegNum.toLowerCase(),
        bikeModel: userInputState.bikeModel,
      })
    )
      .unwrap()
      .then((resp) => {
        if (resp) {
          setUserInputState({ bikeRegNum: "", bikeModel: "" });
          dispatch(closeModal());
          dispatch(getBikes());
        }
      })
      .catch((error) => {
        console.log("error in adding a new bike!", error);
      });
  }

  function handleEditBike(e) {
    e.preventDefault();

    dispatch(
      editBikeRegNum({
        bikeId: selectedBike?.$id,
        bikeRegNum: userInputState?.bikeRegNum,
        bikeModel: userInputState?.bikeModel,
      })
    )
      .unwrap()
      .then(() => {
        dispatch(closeModal());
        dispatch(hideOptionsModal());
        dispatch(getBikes());
      });
  }

  return (
    <form
      className="bg-white w-full max-w-[400px] px-10 py-10 pt-14 rounded flex flex-col gap-4 relative"
      onSubmit={!isEditBike ? handleAddNewBike : handleEditBike}
    >
      <button
        className="absolute right-4 top-3.5 cursor-pointer"
        onClick={() => {
          dispatch(closeModal());
          dispatch(setEditBike(false));
          dispatch(hideOptionsModal());
          dispatch(setOptionsModalPosition({ x: 0, y: 0 }));
        }}
      >
        <span className="text-4xl">
          <IoIosClose />
        </span>
      </button>

      <InputRow
        name={"bikeRegNum"}
        label={"bike register id"}
        type={"text"}
        handleChange={handleChange}
        value={userInputState?.bikeRegNum}
        required={true}
      />

      <InputRow
        name={"bikeModel"}
        label={"bike model (e.g. Hero Splendor)"}
        type={"text"}
        handleChange={handleChange}
        value={userInputState?.bikeModel}
        placeholder="Optional"
      />

      <SubmitBtn text={isEditBike ? "update" : "create a new bike"} />
    </form>
  );
}

export default NewBikeForm;
