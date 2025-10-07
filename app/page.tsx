// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  // send users to login first (or change to "/contacts")
  redirect("/login");
}
