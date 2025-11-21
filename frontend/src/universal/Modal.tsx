"use client";
import React from "react";

const Modal = ({
  children,
  onClose,
  className,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}) => {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal if clicking directly on the backdrop
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen drop-shadow backdrop-blur-md flex items-center justify-center z-50  bg-opacity-50"
      onClick={handleBackdropClick}
    >
      <div
        className={`${className || 'w-[480px]'} rounded-2xl bg-white shadow-xl relative`}
        onClick={(e) => {
          // Prevent clicks inside modal from closing it
          e.stopPropagation();
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
