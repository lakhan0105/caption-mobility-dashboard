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
  const { batteriesList, selectedBattery } = useSelector(
    (state) => state.batteryReducer
  );
  const { isQrCodeComp } = useSelector((state) => state.modalReducer);
  const { totalBatteries } = useSelector((state) => state.countReducer);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getBatteriesList());
  }, []);

  return (
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)] px-0 pt-0">
      <div className="max-w-[900px]">
        {/* PAGE HEADER */}
        <PageHeader
          heading={`Batteries - ${totalBatteries}`}
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
