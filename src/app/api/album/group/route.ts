import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hasActiveSubscription } from "@/lib/billing";

// POST - Create group
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
    const { albumId, name, itemIds } = body;

    if (!albumId || !name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const album = await prisma.album.findFirst({
      where: { id: albumId, userId: session.user.id },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const maxOrder = await prisma.albumGroup.aggregate({
      where: { albumId },
      _max: { order: true },
    });

    const group = await prisma.albumGroup.create({
      data: {
        albumId,
        name,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: { items: true },
    });

    // Move items to group if provided
    if (itemIds?.length) {
      await prisma.albumItem.updateMany({
        where: { id: { in: itemIds }, albumId },
        data: { groupId: group.id },
      });
    }

    const updated = await prisma.albumGroup.findUnique({
      where: { id: group.id },
      include: { items: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Group POST error:", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}

// PATCH - Update group (name, note, order)
export async function PATCH(request: NextRequest) {
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
    const { groupId, name, note, order } = body;

    if (!groupId) {
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }

    const group = await prisma.albumGroup.findFirst({
      where: { id: groupId },
      include: { album: true },
    });

    if (!group || group.album.userId !== session.user.id) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const updated = await prisma.albumGroup.update({
      where: { id: groupId },
      data: {
        ...(name !== undefined && { name }),
        ...(note !== undefined && { note }),
        ...(order !== undefined && { order }),
      },
      include: { items: { orderBy: { order: "asc" } } },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Group PATCH error:", error);
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}

// DELETE - Delete group
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasSubscription = await hasActiveSubscription(session.user.id);
    if (!hasSubscription) {
      return NextResponse.json({ error: "Subscription required" }, { status: 402 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }

    const group = await prisma.albumGroup.findFirst({
      where: { id: groupId },
      include: { album: true },
    });

    if (!group || group.album.userId !== session.user.id) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Items will have groupId set to null (onDelete: SetNull)
    await prisma.albumGroup.delete({ where: { id: groupId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Group DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 });
  }
}
