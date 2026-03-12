import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllCategories } from "@/lib/repositories/universities";
import SellForm from "./SellForm";

export const metadata = { title: "Post a Listing – CampusCart" };

export default async function SellPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in?redirect=/sell");

  const categories = await getAllCategories();

  return <SellForm categories={categories} userId={user.id} />;
}
