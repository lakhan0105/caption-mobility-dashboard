import React, { useEffect } from "react";
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
import { GiBatteries } from "react-icons/gi";

function Batteries() {
  const { batteriesList, batteriesListCount, selectedBattery } = useSelector(
    (state) => state.batteryReducer
  );
  const { isQrCodeComp } = useSelector((state) => state.modalReducer);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getBatteriesList(0));
  }, []);

  // handleLoadMore
  function handleLoadMore() {
    dispatch(getBatteriesList(batteriesList.length));
  }

  return (
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)] pb-28">
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
          icon={<GiBatteries />}
        />

        {/* batteries table */}
        {/* {usersList && <UsersTable data={usersList} />} */}
        <BatteriesTable data={batteriesList} />

        {/* load more button */}
        <div className="text-center">
          {batteriesList?.length !== batteriesListCount && (
            <button
              onClick={handleLoadMore}
              className="mb-28 border px-5 rounded py-1 bg-white text-sm"
            >
              load more
            </button>
          )}
        </div>

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
