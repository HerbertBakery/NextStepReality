// app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  const session = cookies().get("realtor_session")?.value === "ok";
  redirect(session ? "/contacts" : "/login");
}
