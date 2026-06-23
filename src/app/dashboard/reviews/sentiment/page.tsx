import { redirect } from "next/navigation";

export default function SentimentRedirect() {
  redirect("/dashboard/review-management");
}
