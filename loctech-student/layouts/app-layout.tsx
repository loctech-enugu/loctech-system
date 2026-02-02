import { Toaster } from "@/components/ui/sonner";
import AppLayoutTemplate from "@/layouts/app/app-sidebar-layout";
import { type BreadcrumbItem } from "@/types";
import { type ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

// eslint-disable-next-line
export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
  return (
    <>
      <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
      </AppLayoutTemplate>
      <Toaster richColors position="top-center" />
    </>
  );
};
