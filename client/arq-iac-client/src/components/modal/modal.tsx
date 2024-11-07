// modal.tsx
import React from "react";

interface ModalProps {
  isOpen: boolean;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fixed inset-0 flex justify-center items-center bg-gray-800 bg-opacity-50 z-50">
      <div className="modal-content bg-white p-6 rounded-lg shadow-lg">
        <div>{children}</div>
      </div>
    </div>
  );
};

export default Modal;
