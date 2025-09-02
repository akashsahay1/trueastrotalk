
// Completely disabled toast system to prevent React dispatcher errors
export function useToast() {
  return {
    toasts: [],
    toast: () => ({ id: "", dismiss: () => {}, update: () => {} }),
    dismiss: () => {},
  };
}

export function toast() {
  return { id: "", dismiss: () => {}, update: () => {} };
}
