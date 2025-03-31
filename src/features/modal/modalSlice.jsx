import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  modalStatus: false,
  userId: null,
  isPendingPayment: false,
  isAssignForm: false,
  isSwapForm: false,
  isLoading: false,
  optionsModalState: false,
  optionsModalPosition: { x: "", y: "" },
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
      state.isAssignForm = false;
      state.isSwapForm = false;
      state.isPendingPayment = false;
    },
    setUserId(state, action) {
      state.userId = action.payload;
    },
    showEditPaymentModal(state) {
      console.log("running showEditPaymentModal");
      state.isPendingPayment = true;
    },
    showAssignForm(state) {
      state.isAssignForm = true;
    },
    showSwapForm(state) {
      state.isSwapForm = true;
    },
    showLoader(state) {
      state.isLoading = true;
    },
    hideLoader(state) {
      state.isLoading = false;
    },
    showOptionsModal(state) {
      state.optionsModalState = true;
    },
    hideOptionsModal(state) {
      state.optionsModalState = false;
    },
    setOptionsModalPosition(state, { payload }) {
      console.log("running setoptionsmodalposition");
      console.log(payload);
      state.optionsModalPosition = payload;
    },
  },
});

export const {
  showModal,
  closeModal,
  setUserId,
  showEditPaymentModal,
  showAssignForm,
  showSwapForm,
  showLoader,
  hideLoader,
  showOptionsModal,
  hideOptionsModal,
  setOptionsModalPosition,
} = modalSlice.actions;
export default modalSlice.reducer;
