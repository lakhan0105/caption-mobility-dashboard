// This component is for taking the input details for adding a new user
import React, { useState } from "react";
import InputRow from "./InputRow";
import { useDispatch, useSelector } from "react-redux";
import { closeModal } from "../features/modal/modalSlice";
import { createUser, getUsersList } from "../features/user/UserSlice";
import { ID } from "appwrite";
import SubmitBtn from "./Buttons/SubmitBtn";
import toast from "react-hot-toast";

function UserForm() {
  const [userInputState, setUserInputState] = useState({
    userName: "",
    userPhone: "",
    userCompany: "",
  });

  const dispatch = useDispatch();

  // handleCloseModal
  function handleCloseModal() {
    dispatch(closeModal());
  }

  // handleChange
  function handleChange(e) {
    const key = e.target.name;
    let value = e.target.value;

    setUserInputState((prev) => {
      return { ...prev, [key]: value };
    });
  }

  // handleAddUser
  function handleAddUser(e) {
    e.preventDefault();
    const docID = ID.unique();
    dispatch(createUser({ docID, ...userInputState }))
      .then(() => {
        setUserInputState({ userName: "", userPhone: "", userCompany: "" });
        dispatch(closeModal());
        toast.success("user created successfully");
        dispatch(getUsersList());
      })
      .catch((error) => {
        alert("Error in creating the user!", error);
      });
  }

  return (
    <form
      className="bg-white w-full max-w-[350px] px-10 py-10 pt-14 rounded flex flex-col gap-4 relative"
      onSubmit={handleAddUser}
    >
      <button
        className="absolute right-4 top-4 cursor-pointer"
        onClick={handleCloseModal}
      >
        close
      </button>

      <InputRow
        name={"userName"}
        type={"text"}
        label={"Full Name"}
        required={true}
        handleChange={handleChange}
        value={userInputState.userName}
      />

      <InputRow
        name={"userPhone"}
        type={"text"}
        label={"Phone Number"}
        required={true}
        handleChange={handleChange}
        value={userInputState.userPhone}
      />

      <InputRow
        name={"userCompany"}
        type={"text"}
        label={"Company"}
        required={true}
        handleChange={handleChange}
        value={userInputState.userCompany}
      />

      <SubmitBtn text={"create a new user"} />
    </form>
  );
}

export default UserForm;
