import React from "react";

const TableRow = React.forwardRef(({ children, cols }, ref) => {
  return (
    <div
      ref={ref}
      style={{ gridTemplateColumns: cols }}
      className="grid items-start text-sm py-4 px-5 md:px-6 hover:bg-gray-200/50 pointer border-t gap-3 relative"
    >
      {children}
    </div>
  );
});

export default TableRow;
