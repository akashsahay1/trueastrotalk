
import React from "react"

// Completely disabled sonner toast system to prevent React dispatcher errors
const Toaster = ({ ...props }) => {
  return null;
}

const toast = () => {
  return { id: "", dismiss: () => {}, update: () => {} };
}

export { Toaster, toast }
