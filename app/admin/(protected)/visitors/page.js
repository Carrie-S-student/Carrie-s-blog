import VisitorsManager from "@/app/admin/(protected)/visitors/VisitorsManager";
import { getAllVisitors } from "@/lib/visitors";

export const metadata = {
  title: "访问用户管理",
};

export default async function AdminVisitorsPage() {
  const visitors = await getAllVisitors();

  return (
    <div>
      <VisitorsManager visitors={visitors} />
    </div>
  );
}
