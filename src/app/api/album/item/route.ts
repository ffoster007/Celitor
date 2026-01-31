import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hasActiveSubscription } from "@/lib/billing";
import {
  validateCuid,
  validateString,
  validateFilePath,
  validateEnum,
  validatePositiveInt,
  validateAll,
  createValidationError,
  sanitizeString,
  ALBUM_ITEM_TYPES,
} from "@/lib/validation";

// POST - Add bookmark to album
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
    const { albumId, path, name, type } = body;

    // Validate all inputs
    const errors = validateAll([
      () => validateCuid(albumId, "albumId"),
      () => validateFilePath(path, "path"),
      () => validateString(name, "name", { minLength: 1, maxLength: 255 }),
      () => validateEnum(type, "type", ALBUM_ITEM_TYPES),
    ]);

    if (errors.length > 0) {
      return NextResponse.json(createValidationError(errors), { status: 400 });
    }

    // Verify album ownership
    const album = await prisma.album.findFirst({
      where: { id: albumId, userId: session.user.id },
    });

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const maxOrder = await prisma.albumItem.aggregate({
      where: { albumId },
      _max: { order: true },
    });

    const item = await prisma.albumItem.create({
      data: {
        albumId,
        path: sanitizeString(path, 1000),
        name: sanitizeString(name, 255),
        type,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error) {
    console.error("Item POST error:", error);
    return NextResponse.json({ error: "Failed to add bookmark" }, { status: 500 });
  }
}

// PATCH - Update item (note, order, groupId)
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
    const { itemId, note, order, groupId } = body;

    // Validate itemId
    const itemIdError = validateCuid(itemId, "itemId");
    if (itemIdError) {
      return NextResponse.json({ error: itemIdError }, { status: 400 });
    }

    // Validate optional fields
    const errors = validateAll([
      () => note !== undefined ? validateString(note, "note", { required: false, maxLength: 5000 }) : null,
      () => order !== undefined ? validatePositiveInt(order, "order", { max: 10000 }) : null,
      () => groupId !== undefined && groupId !== null ? validateCuid(groupId, "groupId") : null,
    ]);

    if (errors.length > 0) {
      return NextResponse.json(createValidationError(errors), { status: 400 });
    }

    // Verify ownership via album
    const item = await prisma.albumItem.findFirst({
      where: { id: itemId },
      include: { album: true },
    });

    if (!item || item.album.userId !== session.user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updated = await prisma.albumItem.update({
      where: { id: itemId },
      data: {
        ...(note !== undefined && { note: sanitizeString(note, 5000) }),
        ...(order !== undefined && { order }),
        ...(groupId !== undefined && { groupId }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Item PATCH error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

// DELETE - Remove bookmark
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
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json({ error: "Missing itemId" }, { status: 400 });
    }

    const item = await prisma.albumItem.findFirst({
      where: { id: itemId },
      include: { album: true },
    });

    if (!item || item.album.userId !== session.user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.albumItem.delete({ where: { id: itemId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Item DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
