import * as React from "react"
import { cn } from "@/app/lib/utils"

const Form = React.forwardRef<HTMLFormElement, React.ComponentProps<"form">>(
  ({ className, ...props }, ref) => (
    <form ref={ref} className={cn(className)} {...props} />
  )
)
Form.displayName = "Form"

export { Form }
