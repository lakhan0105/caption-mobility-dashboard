import React from "react";

function SimpleBtn({ icon, name, extraStyles, userPhone, action, handleBtn }) {
  return (
    <button
      className={`px-4 py-1.5 rounded border border-indigo-950 flex items-center gap-1.5 ${extraStyles}`}
      onClick={() => {
        if (userPhone) {
          console.log(action);
          if (action === "call") {
            window.location.href = `tel:${userPhone}`;
          } else if (action === "message") {
            const whatsappUrl = `https://wa.me/${userPhone}`;
            window.open(whatsappUrl);
          }
        } else if (handleBtn) {
          handleBtn();
        }
      }}
    >
      <span className="text-[0.8rem]">{icon}</span>
      {name}
    </button>
  );
}

export default SimpleBtn;
