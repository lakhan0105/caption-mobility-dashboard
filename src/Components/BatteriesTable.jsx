import React, { useEffect } from "react";
import GenericTable from "./GenericTable";
import TableHeader from "./TableHeader";
import { useDispatch, useSelector } from "react-redux";
import TableRow from "./TableRow";
import { SlOptionsVertical } from "react-icons/sl";
import OptionsModal from "./OptionsModal";
import {
  hideOptionsModal,
  setIsQrCodeComp,
  setOptionsModalPosition,
  showModal,
  showOptionsModal,
} from "../features/modal/modalSlice";

import {
  deleteBattery,
  getBatteriesList,
  setEditBattery,
  setSelectedBattery,
} from "../features/battery/batterySlice";

function BatteriesTable({ data }) {
  const { isMobile } = useSelector((state) => state.deviceReducer);
  const { optionsModalState } = useSelector((state) => state.modalReducer);
  const { selectedBattery } = useSelector((state) => state.batteryReducer);

  const dispatch = useDispatch();

  const batteryTableHeadings = isMobile
    ? ["#", "batteryNum", "status"]
    : ["#", "batteryNum", "status"];

  const batteryCols = isMobile
    ? "0.1fr 0.6fr 0.5fr 0.05fr"
    : "0.1fr 1fr 0.5fr ";

  // handleOptionsBtn
  function handleOptionsBtn(e, data) {
    e.preventDefault();

    if (optionsModalState) {
      dispatch(hideOptionsModal());
      dispatch(setEditBattery(false));
    } else {
      dispatch(showOptionsModal());
      dispatch(setOptionsModalPosition({ x: e.clientX, y: e.clientY }));
      dispatch(setSelectedBattery(data));
    }
  }

  // handleEditBat
  // opens a modal to edit the battery details
  function handleEditBat(e) {
    e.preventDefault();
    dispatch(setEditBattery(true));
    dispatch(showModal());
  }

  // handleDeleteBat
  function handleDeleteBat(e) {
    e.preventDefault();

    dispatch(deleteBattery(selectedBattery?.$id))
      .unwrap()
      .then(() => {
        dispatch(hideOptionsModal());
        dispatch(getBatteriesList());
      });
  }

  // handleDownloadQr
  // - runs when get qr button is clicked
  function openQrCodeComp(e) {
    e.preventDefault();
    console.log("download qr code");
    console.log(selectedBattery);

    // generate a qr code and download
    dispatch(setIsQrCodeComp(true));
    dispatch(showModal());
    dispatch(hideOptionsModal());
  }

  return (
    <GenericTable>
      <TableHeader data={batteryTableHeadings} cols={batteryCols} />

      {/* TABLE DATA */}
      <div>
        {data?.map((item, index) => {
          const {
            $id,
            batRegNum,
            batStatus,
            currOwner,
            assignedAt,
            returnedAt,
          } = item;

          return (
            <TableRow cols={batteryCols} key={$id}>
              {/* SL NUMBER */}
              <p className="text-[0.7rem] w-[20px] h-[20px] font-medium border bg-indigo-950 text-white flex items-center justify-center rounded-2xl mt-0.5">
                {index + 1}
              </p>

              <h2 className="font-medium text-md capitalize">{batRegNum}</h2>

              {/* BATTERY STATUS */}
              <div className="flex gap-4 justify-center text-xs">
                {batStatus ? (
                  <p className="bg-blue-200 px-4 py-1.5 rounded-2xl">Active</p>
                ) : (
                  <p className="bg-red-400/80 px-3 py-1.5 rounded-2xl">
                    Inactive
                  </p>
                )}
              </div>

              {/* OPTIONS BUTTON */}
              <button
                onClick={(e) => {
                  handleOptionsBtn(e, item);
                }}
              >
                <SlOptionsVertical />
              </button>

              {optionsModalState && (
                <OptionsModal
                  handleEditBtn={handleEditBat}
                  handleDeleteBtn={handleDeleteBat}
                  openQrCodeComp={openQrCodeComp}
                />
              )}
            </TableRow>
          );
        })}
      </div>
    </GenericTable>
  );
}

export default BatteriesTable;
