import { auth } from "./auth";

type AuthenticatedUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export async function requireAuth(): Promise<AuthenticatedUser> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return session.user as AuthenticatedUser;
}
