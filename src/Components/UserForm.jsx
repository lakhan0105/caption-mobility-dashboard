import React, { useEffect, useState } from "react";
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
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { storage } from "../appwrite";

const userBucketId = import.meta.env.VITE_USER_BUCKET_ID;

// Predefined list of companies
const companyOptions = [
  "Zomato",
  "Blinkit",
  "Zepto",
  "Eatsure",
  "Lucious",
  "RR",
  "Flipkart",
  "BBN",
  "Box8",
  "Swiggy",
];

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

  // Pre-fill form for editing
  useEffect(() => {
    if (isEditUser && selectedUser) {
      setUserInputState({
        userName: selectedUser.userName || "",
        userRegisterId: selectedUser.userRegisterId || "",
        userPhone: selectedUser.userPhone || "",
        userCompany: selectedUser.userCompany || "",
        userLocation: selectedUser.userLocation || "",
      });
    }
  }, [isEditUser, selectedUser]);

  // Handle modal close
  function handleCloseModal() {
    dispatch(closeModal());
    dispatch(hideOptionsModal());
  }

  // Handle input change
  function handleChange(e) {
    const key = e.target.name;
    let value = e.target.value;

    setUserInputState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  // Handle success after user creation or update
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
        setUserPhoto(null);
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

  // Handle adding a new user
  async function handleAddUser(e) {
    e.preventDefault();
    const docID = ID.unique();

    console.log("running handleAddUser...");

    // Save the user photo before saving information
    let imageId = null;
    if (userPhoto) {
      try {
        const imageUpload = await storage.createFile(
          userBucketId,
          ID.unique(),
          userPhoto
        );
        imageId = imageUpload.$id;
        console.log("Uploaded image ID:", imageId);
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
          postUserSuccess(
            "User created successfully!",
            userInputState.userCompany.toLowerCase()
          );
        }
      })
      .catch((error) => {
        console.error("Error creating user:", error);
        toast.error("Error in creating the user!");
      });
  }

  // Handle editing an existing user
  async function handleEditUser(e) {
    e.preventDefault();
    console.log("Editing user details:", {
      userId: selectedUser?.$id,
      ...userInputState,
    });

    // Handle photo update if a new photo is selected
    let imageId = selectedUser?.userPhotoId || null;
    if (userPhoto) {
      try {
        const imageUpload = await storage.createFile(
          userBucketId,
          ID.unique(),
          userPhoto
        );
        imageId = imageUpload.$id;
        console.log("Uploaded new image ID:", imageId);
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Failed to upload photo");
        return;
      }
    }

    const userData = {
      userId: selectedUser?.$id,
      userName: userInputState.userName.toLowerCase(),
      userRegisterId: userInputState.userRegisterId,
      userPhone: userInputState.userPhone,
      userCompany: userInputState.userCompany.toLowerCase(),
      userLocation: userInputState.userLocation.toLowerCase(),
      userPhotoId: imageId,
    };

    dispatch(editUser(userData))
      .then((resp) => {
        if (editUser.fulfilled.match(resp)) {
          postUserSuccess(
            "Updated successfully!",
            userInputState.userCompany.toLowerCase()
          );
        }
      })
      .catch((error) => {
        console.error("Error updating user:", error);
        toast.error("Error in updating user details!");
      });
  }

  return (
    <form
      className="bg-white w-full max-w-[380px] px-10 py-10 pt-14 rounded flex flex-col gap-4 relative"
      onSubmit={isEditUser ? handleEditUser : handleAddUser}
    >
      <button
        className="absolute right-4 top-4 cursor-pointer"
        onClick={handleCloseModal}
        type="button"
      >
        Close
      </button>

      <h2 className="text-2xl mb-2">User Details</h2>

      {/* USER NAME */}
      <TextField
        name="userName"
        required
        size="small"
        onChange={handleChange}
        value={userInputState.userName}
        id="userName"
        label="Full Name"
        variant="outlined"
      />

      {/* REGISTER ID */}
      <TextField
        name="userRegisterId"
        size="small"
        label="Register ID"
        required
        onChange={handleChange}
        value={userInputState.userRegisterId}
      />

      {/* PHONE */}
      <TextField
        name="userPhone"
        size="small"
        label="Phone"
        required
        onChange={handleChange}
        value={userInputState.userPhone}
      />

      {/* COMPANY */}
      <FormControl size="small" required>
        <InputLabel id="userCompany-label">Company</InputLabel>
        <Select
          labelId="userCompany-label"
          name="userCompany"
          value={userInputState.userCompany}
          label="Company"
          onChange={handleChange}
        >
          <MenuItem value="">
            <em>Select a company</em>
          </MenuItem>
          {companyOptions.map((company) => (
            <MenuItem key={company} value={company.toLowerCase()}>
              {company}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* USER LOCATION */}
      <TextField
        name="userLocation"
        size="small"
        label="Location"
        required
        onChange={handleChange}
        value={userInputState.userLocation}
      />

      {/* USER PHOTO INPUT */}
      <TextField
        name="userPhoto"
        type="file"
        inputProps={{ accept: "image/*" }}
        onChange={(e) => setUserPhoto(e.target.files[0])}
      />

      <SubmitBtn text={isEditUser ? "Update" : "Create a new user"} />
    </form>
  );
}

export default UserForm;
