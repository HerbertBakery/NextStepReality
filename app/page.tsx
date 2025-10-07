import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
  const loggedIn = cookies().get("realtor_session")?.value === "ok";
  redirect(loggedIn ? "/contacts" : "/login");
}
