import { getAllCourses } from "@/backend/controllers/courses.controller";
import CreateStudentForm, {
    RefreshButton,
} from "@/components/auth/student-register";
import { Toaster } from "@/components/ui/sonner";
import AuthLayout from "@/layouts/auth-layout";
import AuthSimpleLayout from "@/layouts/auth/auth-simple-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Loctech Student Registration | Enroll Today",
    description:
        "Register as a student at Loctech to begin your journey into tech excellence. Fill out your details, select your preferred course, and start learning today.",
    keywords: [
        "Loctech",
        "Student Registration",
        "Tech Training",
        "Coding School",
        "Programming Courses",
        "Enroll",
    ],
    openGraph: {
        title: "Loctech Student Registration",
        description:
            "Join Loctech and unlock your potential. Complete the student registration form to get started.",
        url: "https://loctech.com/register",
        siteName: "Loctech Digital Academy",
        images: [
            {
                url: "/images/loctech-banner.jpg",
                width: 1200,
                height: 630,
                alt: "Loctech Student Registration",
            },
        ],
        locale: "en_US",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Loctech Student Registration",
        description:
            "Kickstart your learning journey with Loctech. Register today to enroll in top-notch tech programs.",
        images: ["/images/loctech-banner.jpg"],
    },
};

export default async function RegisterStudentPage() {
    const courses = await getAllCourses();

    if (!courses || courses.length === 0) {
        return (
            <AuthLayout
                title="Loctech Student Registration Form"
                description="We couldn’t load the available courses right now. Please refresh the page or try again later."
            >
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <p className="text-gray-600">
                        ⚠️ Unable to fetch courses at the moment.
                    </p>
                    <RefreshButton />
                </div>
            </AuthLayout>
        );
    }
    return (
        <AuthSimpleLayout
            title="Loctech Student Registration Form"
            description="Fill in your personal details, select your course, and tell us a bit about yourself to complete your registration."
            isLarge
        >
            <Toaster richColors />
            <CreateStudentForm courses={courses} />
        </AuthSimpleLayout>
    );
}
