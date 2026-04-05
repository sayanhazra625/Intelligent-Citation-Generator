import * as React from "react"
export const Toast = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
export const ToastAction = React.forwardRef<HTMLButtonElement, any>((props, ref) => <button ref={ref} {...props} />)
export const ToastClose = React.forwardRef<HTMLButtonElement, any>((props, ref) => <button ref={ref} {...props} />)
export const ToastTitle = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
export const ToastDescription = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)
export const ToastProvider = ({ children }: any) => <>{children}</>
export const ToastViewport = React.forwardRef<HTMLDivElement, any>((props, ref) => <div ref={ref} {...props} />)