
import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

const YDCard = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("yd-card p-6", className)}
      {...props}
    />
  )
);
YDCard.displayName = "YDCard";

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

const YDCardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5", className)}
      {...props}
    />
  )
);
YDCardHeader.displayName = "YDCardHeader";

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}

const YDCardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight text-yd-navy", className)}
      {...props}
    />
  )
);
YDCardTitle.displayName = "YDCardTitle";

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {}

const YDCardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
);
YDCardDescription.displayName = "YDCardDescription";

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

const YDCardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("pt-4", className)} {...props} />
  )
);
YDCardContent.displayName = "YDCardContent";

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {}

const YDCardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center pt-4", className)}
      {...props}
    />
  )
);
YDCardFooter.displayName = "YDCardFooter";

export { YDCard, YDCardHeader, YDCardTitle, YDCardDescription, YDCardContent, YDCardFooter };
