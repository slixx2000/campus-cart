import { redirect } from "next/navigation";

export const metadata = { title: "Sign Up – CampusCart" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: redirectTo } = await searchParams;
  redirect(`/sign-up${redirectTo ? `?redirect_url=${encodeURIComponent(redirectTo)}` : ""}`);
}
