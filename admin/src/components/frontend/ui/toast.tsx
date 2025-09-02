
import React from "react"

// Completely disabled toast system to prevent React dispatcher errors
const ToastProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

const ToastViewport = React.forwardRef<HTMLDivElement, any>((props, ref) => null)
ToastViewport.displayName = "ToastViewport"

const Toast = React.forwardRef<HTMLDivElement, any>((props, ref) => null)
Toast.displayName = "Toast"

const ToastAction = React.forwardRef<HTMLButtonElement, any>((props, ref) => null)
ToastAction.displayName = "ToastAction"

const ToastClose = React.forwardRef<HTMLButtonElement, any>((props, ref) => null)
ToastClose.displayName = "ToastClose"

const ToastTitle = React.forwardRef<HTMLDivElement, any>((props, ref) => null)
ToastTitle.displayName = "ToastTitle"

const ToastDescription = React.forwardRef<HTMLDivElement, any>((props, ref) => null)
ToastDescription.displayName = "ToastDescription"

type ToastProps = any
type ToastActionElement = any

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
