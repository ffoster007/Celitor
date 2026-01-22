import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET - Fetch albums for a repository (shared with contributors)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repoOwner = searchParams.get("repoOwner");
    const repoName = searchParams.get("repoName");

    if (!repoOwner || !repoName) {
      return NextResponse.json({ error: "Missing repository info" }, { status: 400 });
    }

    // Fetch albums - For security, in production you'd verify contributor access via GitHub API
    // For now, we fetch user's own albums + albums shared in the same repo
    const albums = await prisma.album.findMany({
      where: { repoOwner, repoName, userId: session.user.id },
      include: {
        items: { orderBy: { order: "asc" } },
        groups: { include: { items: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
      },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({ success: true, data: albums });
  } catch (error) {
    console.error("Album GET error:", error);
    return NextResponse.json({ error: "Failed to fetch albums" }, { status: 500 });
  }
}

// POST - Create new album
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, repoOwner, repoName } = body;

    if (!name || !repoOwner || !repoName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const maxOrder = await prisma.album.aggregate({
      where: { userId: session.user.id, repoOwner, repoName },
      _max: { order: true },
    });

    const album = await prisma.album.create({
      data: {
        name,
        repoOwner,
        repoName,
        userId: session.user.id,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: { items: true, groups: { include: { items: true } } },
    });

    return NextResponse.json({ success: true, data: album });
  } catch (error) {
    console.error("Album POST error:", error);
    return NextResponse.json({ error: "Failed to create album" }, { status: 500 });
  }
}

// PATCH - Update album (name, note, order)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { albumId, name, note, order } = body;

    if (!albumId) {
      return NextResponse.json({ error: "Missing albumId" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.album.findFirst({
      where: { id: albumId, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const album = await prisma.album.update({
      where: { id: albumId },
      data: {
        ...(name !== undefined && { name }),
        ...(note !== undefined && { note }),
        ...(order !== undefined && { order }),
      },
      include: { items: { orderBy: { order: "asc" } }, groups: { include: { items: true } } },
    });

    return NextResponse.json({ success: true, data: album });
  } catch (error) {
    console.error("Album PATCH error:", error);
    return NextResponse.json({ error: "Failed to update album" }, { status: 500 });
  }
}

// DELETE - Delete album
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get("albumId");

    if (!albumId) {
      return NextResponse.json({ error: "Missing albumId" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.album.findFirst({
      where: { id: albumId, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    await prisma.album.delete({ where: { id: albumId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Album DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete album" }, { status: 500 });
  }
}
