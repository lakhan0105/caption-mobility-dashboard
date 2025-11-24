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
    planType: "CS", // ← NEW: Default plan
  });

  const [userPhoto, setUserPhoto] = useState(null);

  useEffect(() => {
    if (isEditUser && selectedUser) {
      setUserInputState({
        userName: selectedUser.userName || "",
        userRegisterId: selectedUser.userRegisterId || "",
        userPhone: selectedUser.userPhone || "",
        userCompany: selectedUser.userCompany || "",
        userLocation: selectedUser.userLocation || "",
        planType: selectedUser.planType || "BS",
      });
    }
  }, [isEditUser, selectedUser]);

  function handleCloseModal() {
    dispatch(closeModal());
    dispatch(hideOptionsModal());
  }

  function handleChange(e) {
    const key = e.target.name;
    let value = e.target.value;
    setUserInputState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function postUserSuccess(msg, companyName) {
    if (!companyName) {
      toast.error("Company name is required");
      return;
    }

    dispatch(addCompanyIfNew(companyName.toLowerCase()))
      .unwrap()
      .then(() => {
        dispatch(getCompanyNames());
        setUserInputState({
          userName: "",
          userRegisterId: "",
          userPhone: "",
          userCompany: "",
          userLocation: "",
          planType: "CS",
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
      });
  }

  async function handleAddUser(e) {
    e.preventDefault();
    const docID = ID.unique();

    let imageId = null;
    if (userPhoto) {
      try {
        const imageUpload = await storage.createFile(
          userBucketId,
          ID.unique(),
          userPhoto
        );
        imageId = imageUpload.$id;
      } catch (error) {
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
      planType: userInputState.planType || "CS", // ← ONLY THIS IS NEW
    };

    dispatch(createUser(userData))
      .then((resp) => {
        if (createUser.fulfilled.match(resp)) {
          postUserSuccess(
            "User created successfully!",
            userInputState.userCompany
          );
        }
      })
      .catch((error) => {
        toast.error("Error creating user!");
      });
  }

  async function handleEditUser(e) {
    e.preventDefault();

    let imageId = selectedUser?.userPhotoId || null;
    if (userPhoto) {
      try {
        const imageUpload = await storage.createFile(
          userBucketId,
          ID.unique(),
          userPhoto
        );
        imageId = imageUpload.$id;
      } catch (error) {
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
      planType: userInputState.planType, // ← ONLY THIS IS NEW
    };

    dispatch(editUser(userData))
      .then((resp) => {
        if (editUser.fulfilled.match(resp)) {
          postUserSuccess("Updated successfully!", userInputState.userCompany);
        }
      })
      .catch((error) => {
        toast.error("Error updating user!");
      });
  }

  return (
    <form
      className="bg-white w-full max-w-[380px] px-10 py-10 pt-14 rounded flex flex-col gap-4 relative"
      onSubmit={isEditUser ? handleEditUser : handleAddUser}
    >
      <button
        className="absolute right-4 top-4 cursor-pointer text-gray-600 hover:text-red-600"
        onClick={handleCloseModal}
        type="button"
      >
        ✕
      </button>

      <h2 className="text-2xl mb-2 font-bold">User Details</h2>

      <TextField
        name="userName"
        required
        size="small"
        label="Full Name"
        variant="outlined"
        value={userInputState.userName}
        onChange={handleChange}
      />

      <TextField
        name="userRegisterId"
        size="small"
        label="Register ID"
        required
        value={userInputState.userRegisterId}
        onChange={handleChange}
      />

      <TextField
        name="userPhone"
        size="small"
        label="Phone"
        required
        value={userInputState.userPhone}
        onChange={handleChange}
      />

      <FormControl size="small" required>
        <InputLabel>Company</InputLabel>
        <Select
          name="userCompany"
          value={userInputState.userCompany}
          label="Company"
          onChange={handleChange}
        >
          <MenuItem value="">
            <em>Select company</em>
          </MenuItem>
          {companyOptions.map((company) => (
            <MenuItem key={company} value={company.toLowerCase()}>
              {company}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* NEW: Plan Type */}
      <FormControl size="small" required>
        <InputLabel>Plan Type</InputLabel>
        <Select
          name="planType"
          value={userInputState?.planType}
          label="Plan Type"
          onChange={handleChange}
        >
          <MenuItem value="CS">CS - ₹1740/week</MenuItem>
          <MenuItem value="BS">BS - ₹1800/week</MenuItem>
        </Select>
      </FormControl>

      <TextField
        name="userLocation"
        size="small"
        label="Location"
        required
        value={userInputState.userLocation}
        onChange={handleChange}
      />

      <TextField
        type="file"
        label="User Photo"
        InputLabelProps={{ shrink: true }}
        inputProps={{ accept: "image/*" }}
        onChange={(e) => setUserPhoto(e.target.files[0])}
      />

      <SubmitBtn text={isEditUser ? "Update User" : "Create User"} />
    </form>
  );
}

export default UserForm;
