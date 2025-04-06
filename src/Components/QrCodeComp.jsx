import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { closeModal, setIsQrCodeComp } from "../features/modal/modalSlice";
import { QRCodeCanvas } from "qrcode.react";
import { IoClose } from "react-icons/io5";
import { MdOutlineFileDownload } from "react-icons/md";

function QrCodeComp({ batteryId }) {
  const dispatch = useDispatch();

  function handleClose(e) {
    dispatch(setIsQrCodeComp(false));
    dispatch(closeModal());
  }

  useEffect(() => {
    const canvasEl = document.querySelector(".qr-container canvas");

    // convert to data url
    const url = canvasEl.toDataURL("image/png");

    const downloadLinkEl = document.getElementById("download-link");
    if (downloadLinkEl) {
      downloadLinkEl.href = url;
      downloadLinkEl.download = `${batteryId}-qr-code.png`;
    }
  }, []);

  return (
    <div id="qr-code-comp" className="bg-white rounded-md relative py-10 px-14">
      {/* CLOSE BUTTON */}
      <button className="absolute right-1 top-1.5" onClick={handleClose}>
        <span className="text-2xl">
          <IoClose />
        </span>
      </button>

      {/* QR CONTAINER */}
      <div className="qr-container">
        <QRCodeCanvas value={batteryId} className="" />
      </div>

      <div className="text-sm capitalize py-1.5 rounded mt-4 flex items-center justify-center gap-1 bg-blue-500 text-white">
        <span>
          <MdOutlineFileDownload />
        </span>
        {/* DOWNLOAD BUTTON */}
        <a id="download-link" href="" className="">
          download
        </a>
      </div>
    </div>
  );
}

export default QrCodeComp;
