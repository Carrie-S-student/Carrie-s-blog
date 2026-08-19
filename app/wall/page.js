import { getPublishedNotes } from "@/lib/notes";
import NoteWall from "@/app/components/notes/NoteWall";
import { verifySession, getCurrentVisitor } from "@/lib/dal";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "留言墙",
  description: "一面随风飘动的便签墙：写下此刻的想法、几句感悟，贴到墙上和大家分享。",
};

export default async function WallPage() {
  const [notes, session, visitor] = await Promise.all([
    getPublishedNotes(),
    verifySession(),
    getCurrentVisitor(),
  ]);

  return (
    <div className="w-full px-3 pb-12 pt-4 sm:px-4">
      <p className="text-center text-sm text-muted">
        突然冒出来的想法、几句感悟，随手写下来贴到墙上。纸条会轻轻飘动，点开还有小惊喜。
      </p>
      <NoteWall
        notes={notes}
        currentVisitorId={visitor?.id ?? null}
        isAdmin={session?.role === "admin"}
      />
    </div>
  );
}
