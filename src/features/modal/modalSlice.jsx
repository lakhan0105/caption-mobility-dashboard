import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  modalStatus: false,
  userId: null,
};

const modalSlice = createSlice({
  name: "modal",
  initialState,
  reducers: {
    showModal(state) {
      state.modalStatus = true;
    },
    closeModal(state) {
      state.modalStatus = false;
    },
    setUserId(state, action) {
      state.userId = action.payload;
    },
  },
});

export const { showModal, closeModal, setUserId } = modalSlice.actions;
export default modalSlice.reducer;
