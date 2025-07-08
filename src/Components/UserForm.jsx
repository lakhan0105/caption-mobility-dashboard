// This component is for taking the input details for adding a new user
import React, { useEffect, useState } from "react";
import InputRow from "./InputRow";
import { useDispatch, useSelector } from "react-redux";
import { closeModal, hideOptionsModal } from "../features/modal/modalSlice";
import { createUser, editUser, getUsersList } from "../features/user/UserSlice";
import { ID } from "appwrite";
import SubmitBtn from "./Buttons/SubmitBtn";
import toast from "react-hot-toast";
import {
  addCompanyIfNew,
  getCompanyNames,
} from "../features/company/companySlice";
import { Button, TextField } from "@mui/material";
import { storage } from "../appwrite";
const userBucketId = import.meta.env.VITE_USER_BUCKET_ID;

function UserForm() {
  const { isEditUser, selectedUser } = useSelector(
    (state) => state.userReducer
  );

  const dispatch = useDispatch();

  const [userInputState, setUserInputState] = useState({
    userName: "",
    userRegisterId: "",
    userPhone: "",
    userCompany: "",
    userLocation: "",
  });

  const [userPhoto, setUserPhoto] = useState(null);

  // when this component load, check if isEdit is true, if true then automatically fill the form with the details, so the user can edit it
  useEffect(() => {
    if (isEditUser) {
      setUserInputState({
        userName: selectedUser?.userName,
        userRegisterId: selectedUser?.userRegisterId,
        userPhone: selectedUser?.userPhone,
        userCompany: selectedUser?.userCompany,
        userLocation: selectedUser?.userLocation,
      });
    }
  }, []);

  // handleCloseModal
  function handleCloseModal() {
    dispatch(closeModal());
    dispatch(hideOptionsModal());
  }

  // handleChange
  function handleChange(e) {
    const key = e.target.name;
    let value = e.target.value;

    setUserInputState((prev) => {
      return { ...prev, [key]: value };
    });
  }

  // postUserSuccess
  function postUserSuccess(msg, companyName) {
    if (!companyName) {
      toast.error("Company name is required");
      return;
    }

    dispatch(addCompanyIfNew(companyName.toLowerCase()))
      .unwrap()
      .then(() => {
        dispatch(getCompanyNames()); // Refresh company names
        setUserInputState({
          userName: "",
          userRegisterId: "",
          userPhone: "",
          userCompany: "",
          userLocation: "",
        });
        dispatch(closeModal());
        toast.success(msg);
        dispatch(getUsersList());
      })
      .catch((error) => {
        toast.error(
          `Failed to add company: ${error.message || "Unknown error"}`
        );
        console.error("addCompanyIfNew error:", error);
      });
  }

  // handleAddUser
  async function handleAddUser(e) {
    e.preventDefault();
    const docID = ID.unique();

    console.log("running handleAddUser...");

    // save the user photo before saving his information
    let imageId = null;

    if (userPhoto) {
      try {
        const imageUpload = await storage.createFile(
          userBucketId,
          ID.unique(),
          userPhoto
        );
        imageId = imageUpload.$id;
        console.log(imageId);
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Failed to upload photo");
        return;
      }
    }

    const userData = {
      docID,
      userName: userInputState.userName.toLowerCase(),
      userRegisterId: userInputState.userRegisterId,
      userPhone: userInputState.userPhone,
      userCompany: userInputState.userCompany.toLowerCase(),
      userLocation: userInputState.userLocation.toLowerCase(),
      userPhotoId: imageId,
    };

    dispatch(createUser(userData))
      .then((resp) => {
        if (createUser.fulfilled.match(resp)) {
          // if the user has been created successfully then add a company name (if new)
          postUserSuccess(
            "user created successfully!",
            userInputState.userCompany.toLowerCase()
          );
        }
      })
      .catch((error) => {
        alert("Error in creating the user!", error);
      });
  }

  // handleEditUser
  function handleEditUser(e) {
    e.preventDefault();
    console.log("edit the user details");
    console.log({ userId: selectedUser?.$id, ...userInputState });
    dispatch(editUser({ userId: selectedUser?.$id, ...userInputState }))
      .then((resp) => {
        if (editUser.fulfilled.match(resp)) {
          postUserSuccess(
            "updated successfully!",
            userInputState.userCompany.toLowerCase()
          );
        }
      })
      .catch((error) => {
        alert("error in updating user details", error);
      });
  }

  return (
    <form
      className="bg-white w-full max-w-[380px] px-10 py-10 pt-14 rounded flex flex-col gap-4 relative "
      onSubmit={!isEditUser ? handleAddUser : handleEditUser}
    >
      <button
        className="absolute right-4 top-4 cursor-pointer"
        onClick={handleCloseModal}
      >
        close
      </button>

      <h2 className="text-2xl mb-2">User Details</h2>

      {/* USER NAME */}
      <TextField
        name="userName"
        required
        size="small"
        onChange={handleChange}
        value={userInputState?.userName}
        id="outlined-basic"
        label="Full Name"
        variant="outlined"
      />

      {/* REGISTER ID */}
      <TextField
        name="userRegisterId"
        size="small"
        label="Register Id"
        required
        onChange={handleChange}
        value={userInputState?.userRegisterId}
      />

      {/* PHONE */}
      <TextField
        name="userPhone"
        size="small"
        label="Phone"
        required
        onChange={handleChange}
        value={userInputState?.userPhone}
      />

      {/* COMPANY*/}
      <TextField
        name="userCompany"
        size="small"
        label="Company"
        required
        onChange={handleChange}
        value={userInputState?.userCompany}
      />

      {/* USER LOCATION */}
      <TextField
        name="userLocation"
        size="small"
        label="Location"
        required
        onChange={handleChange}
        value={userInputState?.userLocation}
      />

      {/* USER PHOTO INPUT */}
      <TextField
        name="userPhoto"
        type="file"
        inputProps={{ accept: "image/*" }}
        onChange={(e) => setUserPhoto(e.target.files[0])}
      />

      <SubmitBtn text={isEditUser ? "update" : "Create a new user"} />
    </form>
  );
}

export default UserForm;
