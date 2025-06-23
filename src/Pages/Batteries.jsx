import React, { useEffect, useRef, useCallback } from "react";
import {
  BatteriesTable,
  Modal,
  NewBatteryForm,
  PageHeader,
  QrCodeComp,
} from "../Components";
import { useDispatch, useSelector } from "react-redux";
import {
  getBatteriesList,
  setEditBattery,
} from "../features/battery/batterySlice";
import { showModal } from "../features/modal/modalSlice";
// import { GiBattery } from "react-icons/gi"; // Corrected import

function Batteries() {
  const { batteriesList, batteriesListCount, isLoading, selectedBattery } =
    useSelector((state) => state.batteryReducer);
  const { isQrCodeComp } = useSelector((state) => state.modalReducer);
  const dispatch = useDispatch();
  const observer = useRef();

  // Reference to the last battery
  const lastBatteryElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      console.log("Last battery row ref:", node); // Debug log
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            batteriesList?.length < batteriesListCount
          ) {
            dispatch(getBatteriesList(batteriesList?.length));
          }
        },
        { rootMargin: "100px" } // Trigger 100px before the last row is visible
      );
      if (node) observer.current.observe(node);
    },
    [isLoading, batteriesList?.length, batteriesListCount, dispatch]
  );

  useEffect(() => {
    if (!batteriesList || !batteriesList?.length) {
      dispatch(getBatteriesList(0));
    }
  }, [dispatch, batteriesList]);

  return (
    <section className="w-full max-w-[900px] mx-auto md:ml-[300px] md:w-[calc(100%-300px)] pb-28">
      <div className="max-w-[900px]">
        {/* PAGE HEADER */}
        <PageHeader
          heading={`Batteries - ${
            batteriesListCount ? batteriesListCount : "loading"
          }`}
          btnName={"+ add new battery"}
          handleFunction={() => {
            dispatch(setEditBattery(false));
            dispatch(showModal());
          }}
          // icon={<GiBattery />}
        />

        {/* Batteries table */}
        {batteriesList && (
          <BatteriesTable
            data={batteriesList}
            lastBatteryElementRef={lastBatteryElementRef}
          />
        )}

        {/* Loading indicator */}
        {isLoading && batteriesList?.length > 0 && (
          <div className="text-center py-4">Loading more batteries...</div>
        )}

        <Modal>
          {isQrCodeComp ? (
            <QrCodeComp batteryId={selectedBattery?.$id} />
          ) : (
            <NewBatteryForm />
          )}
        </Modal>
      </div>
    </section>
  );
}

export default Batteries;
