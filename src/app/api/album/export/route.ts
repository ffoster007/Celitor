import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import JSZip from "jszip";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hasActiveSubscription } from "@/lib/billing";

function sanitizeName(name?: string) {
  if (!name) return "";
  return name.replace(/[/\\?%*:|"<>]/g, "-").replace(/\s+/g, " ").trim();
}

// Export changed: we no longer fetch files from GitHub. Instead we export only notes saved on album/group/item.
// Helper to create an item note file content
function buildItemNoteContent(item: any) {
  const title = item.name || item.id;
  const note = item.note ?? "";
  return `# ${title}\n\n${note}\n`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasSubscription = await hasActiveSubscription(session.user.id);
    if (!hasSubscription) {
      return NextResponse.json({ error: "Subscription required" }, { status: 402 });
    }

    const body = await request.json();
    const { albumId } = body || {};
    if (!albumId) return NextResponse.json({ error: "Missing albumId" }, { status: 400 });

    const album = await prisma.album.findFirst({
      where: { id: albumId, userId: session.user.id },
      include: {
        items: { orderBy: { order: "asc" } },
        groups: { include: { items: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
      },
    });

    if (!album) return NextResponse.json({ error: "Album not found" }, { status: 404 });

    const zip = new JSZip();

    // Root README with album note
    const albumNote = album.note ?? "";
    zip.file("README.md", `# ${album.name}\n\n${albumNote}\n`);

    // Add grouped items as folders with README (group note), and include per-item note files only when item.note exists
    for (const group of album.groups) {
      const folderName = sanitizeName(group.name) || `group-${group.id}`;
      const folder = zip.folder(folderName) as JSZip;
      if (group.note) folder.file("README.md", group.note);

      const groupItems = album.items.filter((i) => i.groupId === group.id && i.note && i.note.trim().length > 0);
      for (const item of groupItems) {
        const filenameBase = sanitizeName(item.name) || sanitizeName(item.path?.split("/").pop() || item.id) || item.id;
        const filename = `${filenameBase}.md`;
        folder.file(filename, buildItemNoteContent(item));
      }
    }

    // Ungrouped items with notes go to root (no folder)
    const ungrouped = album.items.filter((i) => !i.groupId && i.note && i.note.trim().length > 0);
    for (const item of ungrouped) {
      const filenameBase = sanitizeName(item.name) || sanitizeName(item.path?.split("/").pop() || item.id) || item.id;
      const filename = `${filenameBase}.md`;
      zip.file(filename, buildItemNoteContent(item));
    }

    const zipData = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });

    const safeName = sanitizeName(album.name) || album.id;
    const asciiName = safeName.replace(/[^\x20-\x7E]/g, "_") || album.id;
    const encodedName = encodeURIComponent(`${safeName}.zip`);
    const contentDisposition = `attachment; filename="${asciiName}.zip"; filename*=UTF-8''${encodedName}`;

    return new NextResponse(zipData, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (error) {
    console.error("Album export error:", error);
    return NextResponse.json({ error: "Failed to export album" }, { status: 500 });
  }
}
