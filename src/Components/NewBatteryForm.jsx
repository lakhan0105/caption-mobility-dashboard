import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SubmitBtn from "./Buttons/SubmitBtn";
import InputRow from "./InputRow";
import { closeModal, hideOptionsModal } from "../features/modal/modalSlice";
import {
  addNewBattery,
  editBatRegNum,
  getBatteriesList,
} from "../features/battery/batterySlice";

function NewBatteryForm() {
  const dispatch = useDispatch();
  const { selectedBattery, isEditBattery } = useSelector(
    (state) => state.batteryReducer
  );

  const [userInputState, setUserInputState] = useState({ batRegNum: "" });

  useEffect(() => {
    if (isEditBattery) {
      console.log(selectedBattery);
      setUserInputState({ batRegNum: selectedBattery?.batRegNum });
    }
  }, []);

  // function to handleChange
  function handleChange(e) {
    const key = e.target.name;
    const value = e.target.value;

    setUserInputState((prev) => {
      return { ...prev, [key]: value };
    });
  }

  // function handleAddNewBattery
  function handleAddNewBattery(e) {
    e.preventDefault();

    dispatch(
      addNewBattery({ batRegNum: userInputState.batRegNum.toLowerCase() })
    )
      .unwrap()
      .then((resp) => {
        if (resp) {
          setUserInputState({});
          dispatch(closeModal());
          dispatch(getBatteriesList());
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  // function handleEditBattery
  function handleEditBattery(e) {
    e.preventDefault();

    dispatch(
      editBatRegNum({
        $id: selectedBattery?.$id,
        batRegNum: userInputState?.batRegNum,
      })
    )
      .unwrap()
      .then(() => {
        dispatch(hideOptionsModal());
        dispatch(closeModal());
        dispatch(getBatteriesList());
      });
  }

  return (
    <form
      className="bg-white w-full max-w-[400px] px-10 py-10 pt-14 rounded flex flex-col gap-4 relative"
      onSubmit={isEditBattery ? handleEditBattery : handleAddNewBattery}
    >
      <button
        className="absolute right-4 top-4 cursor-pointer"
        onClick={() => {
          dispatch(closeModal());
        }}
      >
        close
      </button>

      {/* BATTERY REG NUMBER */}
      <InputRow
        name={"batRegNum"}
        label={"battery register id"}
        type={"text"}
        handleChange={handleChange}
        value={userInputState.batRegNum}
        required={true}
      />

      <SubmitBtn text={isEditBattery ? "update" : "create a new battery"} />
    </form>
  );
}

export default NewBatteryForm;
