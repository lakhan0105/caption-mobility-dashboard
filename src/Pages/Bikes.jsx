import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBikes } from "../features/bike/bikeSlice";
import {
  BikesTable,
  GenericTable,
  Modal,
  NewBikeForm,
  PageHeader,
  TableHeader,
} from "../Components";
import { showModal } from "../features/modal/modalSlice";

import { MdOutlineElectricBike } from "react-icons/md";

function Bikes() {
  const dispatch = useDispatch();

  const { bikesList, bikesListCount, isLoading } = useSelector(
    (state) => state.bikeReducer
  );

  useEffect(() => {
    dispatch(getBikes(0));
  }, []);

  // handleLoadMore
  // - loads more bikes list
  function handleLoadMore() {
    dispatch(getBikes(bikesList?.length));
  }

  return (
    <section className="w-full max-w-[900px] md:ml-[300px] md:w-[calc(100%-300px)] pb-28">
      <div className="max-w-[900px]">
        <PageHeader
          heading={`bikes - ${bikesListCount ? bikesListCount : "loading..."}`}
          btnName={"+ add new bike"}
          handleFunction={() => {
            dispatch(showModal());
          }}
          icon={<MdOutlineElectricBike />}
        />

        {/* bikes table */}
        {bikesList && <BikesTable data={bikesList} />}

        {/* load more button */}
        <div className="text-center">
          {bikesList?.length !== bikesListCount && !isLoading && (
            <button
              onClick={handleLoadMore}
              className="mb-28 border px-5 rounded py-1 bg-white text-sm"
            >
              load more
            </button>
          )}
        </div>

        <Modal>
          <NewBikeForm />
        </Modal>
      </div>
    </section>
  );
}

export default Bikes;
