import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Dashboard from "@/components/dashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session ) {
     
    redirect("/login");
  }

  return  <Dashboard/>;
}