import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function EstudianteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== 1) redirect("/dashboard");
  return <>{children}</>;
}
