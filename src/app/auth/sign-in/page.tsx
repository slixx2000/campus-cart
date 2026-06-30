import { redirect } from "next/navigation";

export const metadata = { title: "Sign In – CampusCart" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectTo } = await searchParams;
  redirect(`/sign-in${redirectTo ? `?redirect_url=${encodeURIComponent(redirectTo)}` : ""}`);
}
