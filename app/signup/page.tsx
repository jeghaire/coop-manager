import { redirect } from "next/navigation";

export default function OldSignupRedirect() {
  redirect("/auth/signup");
}
