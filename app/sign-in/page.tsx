import { SignInPanel } from "@/components/SignInPanel";
import { isAuthConfigured } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  return <SignInPanel configured={isAuthConfigured()} returnTo={returnTo?.startsWith("/") ? returnTo : "/admin"} />;
}
