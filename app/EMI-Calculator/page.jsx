import React from 'react'
import EmiCalculator from "@/components/EMICalculator";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getServerSession(authOptions);

  if (!session ) {
     
    redirect("/login");
  }

  return <EmiCalculator />;
}