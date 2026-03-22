import InquiryForm from "@/components/inquiry/inquiry-form";
import AuthLayout from "@/layouts/auth-layout";
import { Toaster } from "@/components/ui/sonner";
import { getAllCourses } from "@/backend/controllers/courses.controller";

export const metadata = {
  title: "Contact Us - Loctech Training Institute",
  description: "Have a question? Get in touch with Loctech Training Institute.",
};

export default async function InquiryPage() {
  let courses: { id: string; title: string }[] = [];
  try {
    const allCourses = await getAllCourses();
    courses = (allCourses ?? []).map((c: { id: string; title: string }) => ({
      id: c.id,
      title: c.title ?? "",
    }));
  } catch {
    // Courses optional for inquiry
  }

  return (
    <AuthLayout
      title="Get in Touch"
      description="Fill out the form below and we'll get back to you within 1-2 business days."
    >
      <InquiryForm courses={courses} />
      <Toaster richColors />
    </AuthLayout>
  );
}
