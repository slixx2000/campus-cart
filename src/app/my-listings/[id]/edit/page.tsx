import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListingById } from "@/lib/repositories/listings";
import { getAllCategories } from "@/lib/repositories/universities";
import EditListingForm from "./EditListingForm";

export const metadata = { title: "Edit Listing – CampusCart" };

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/sign-in");

  const [row, categories] = await Promise.all([
    getListingById(id),
    getAllCategories(),
  ]);

  if (!row || row.seller_id !== user.id) notFound();

  return (
    <EditListingForm
      listing={row}
      categories={categories}
    />
  );
}
