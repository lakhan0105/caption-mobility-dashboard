import React, { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getBikes } from "../features/bike/bikeSlice";
import { BikesTable, Modal, NewBikeForm, PageHeader } from "../Components";
import { showModal } from "../features/modal/modalSlice";
import { MdOutlineElectricBike } from "react-icons/md";

function Bikes() {
  const dispatch = useDispatch();
  const { bikesList, bikesListCount, isLoading } = useSelector(
    (state) => state.bikeReducer
  );
  const observer = useRef();

  // Reference to the last bike element
  const lastBikeElementRef = useCallback(
    (node) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && bikesList?.length < bikesListCount) {
            dispatch(getBikes(bikesList?.length));
          }
        },
        { rootMargin: "100px" } // Trigger 100px before the last row is visible
      );
      if (node) observer.current.observe(node);
    },
    [isLoading, bikesList?.length, bikesListCount, dispatch]
  );

  useEffect(() => {
    if (!bikesList || !bikesList?.length) {
      dispatch(getBikes(0));
    }
  }, [dispatch, bikesList]);

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

        {/* Bikes table */}
        {bikesList && (
          <BikesTable
            data={bikesList}
            lastBikeElementRef={lastBikeElementRef}
          />
        )}

        {/* Loading indicator */}
        {isLoading && bikesList?.length > 0 && (
          <div className="text-center py-4">Loading more bikes...</div>
        )}

        <Modal>
          <NewBikeForm />
        </Modal>
      </div>
    </section>
  );
}

export default Bikes;
