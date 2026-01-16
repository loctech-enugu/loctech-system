import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { userLinks } from "@/lib/utils";
import { getAllUsers } from "@/backend/controllers/users.controller";
import AddUserModal from "@/components/users/create";
import { UsersTable } from "@/components/users/table";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Users",
    href: userLinks.users,
  },
];
async function UserPage() {
  const users = await getAllUsers();
  console.log("users: ", users);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Users</h1>
          <div className="flex items-center gap-2">
            <AddUserModal />
          </div>
        </div>
        <hr />

        <UsersTable
          users={users?.map((i) => ({ ...i, bankDetails: undefined })) ?? []}
        />
      </div>
    </AppLayout>
  );
}

export default UserPage;
