import React from "react";

const LoadingSpinner = ({ size = "md" }) => {
  const sizeClass =
    size === "xl"
      ? "w-16 h-16 border-4"
      : size === "lg"
      ? "w-12 h-12 border-4"
      : "w-8 h-8 border-2";

  return (
    <div
      className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${sizeClass}`}
    ></div>
  );
};

export default LoadingSpinner;
