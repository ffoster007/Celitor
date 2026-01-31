import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hasActiveSubscription } from "@/lib/billing";
import { checkForkStatus } from "@/lib/github";
import {
  validateString,
  validateCuid,
  validateRepoIdentifier,
  validatePositiveInt,
  validateAll,
  createValidationError,
  sanitizeString,
} from "@/lib/validation";

// GET - Fetch albums for a repository (includes albums from source repo for forks)
export async function GET(request: NextRequest) {
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
    const repoOwner = searchParams.get("repoOwner");
    const repoName = searchParams.get("repoName");

    if (!repoOwner || !repoName) {
      return NextResponse.json({ error: "Missing repository info" }, { status: 400 });
    }

    // Fetch user's own albums for this repo
    const userAlbums = await prisma.album.findMany({
      where: { repoOwner, repoName, userId: session.user.id },
      include: {
        items: { orderBy: { order: "asc" } },
        groups: { include: { items: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
      },
      orderBy: { order: "asc" },
    });

    // Check if this repo is a fork and fetch albums from source repository
    let sourceAlbums: typeof userAlbums = [];
    let forkInfo = null;

    if (session.user.accessToken) {
      try {
        forkInfo = await checkForkStatus(session.user.accessToken, repoOwner, repoName);
        
        if (forkInfo.isFork && forkInfo.sourceOwner && forkInfo.sourceName) {
          // Fetch all albums from the source repository (from all users)
          const sourceRepoAlbums = await prisma.album.findMany({
            where: {
              repoOwner: forkInfo.sourceOwner,
              repoName: forkInfo.sourceName,
              isShared: false, // Only original albums, not synced ones
            },
            include: {
              items: { orderBy: { order: "asc" } },
              groups: { include: { items: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
              user: { select: { name: true, image: true } }, // Include creator info
            },
            orderBy: { order: "asc" },
          });

          // Mark these albums as from source repo and transform them
          sourceAlbums = sourceRepoAlbums.map(album => ({
            ...album,
            isFromSourceRepo: true,
            sourceRepoOwner: forkInfo!.sourceOwner,
            sourceRepoName: forkInfo!.sourceName,
          })) as typeof userAlbums;
        }
      } catch (error) {
        console.error("Error checking fork status:", error);
        // Continue without source albums if fork check fails
      }
    }

    // Combine user's albums with source repo albums
    // Filter out source albums that user has already synced (by sourceAlbumId)
    const syncedAlbumIds = new Set(
      userAlbums
        .filter(a => a.sourceAlbumId)
        .map(a => a.sourceAlbumId)
    );

    const filteredSourceAlbums = sourceAlbums.filter(
      album => !syncedAlbumIds.has(album.id)
    );

    const allAlbums = [...userAlbums, ...filteredSourceAlbums];

    return NextResponse.json({ 
      success: true, 
      data: allAlbums,
      forkInfo: forkInfo?.isFork ? {
        sourceOwner: forkInfo.sourceOwner,
        sourceName: forkInfo.sourceName,
      } : null,
    });
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

    const hasSubscription = await hasActiveSubscription(session.user.id);
    if (!hasSubscription) {
      return NextResponse.json({ error: "Subscription required" }, { status: 402 });
    }

    const body = await request.json();
    const { name, repoOwner, repoName } = body;

    // Validate inputs
    const errors = validateAll([
      () => validateString(name, "name", { minLength: 1, maxLength: 100 }),
      () => validateRepoIdentifier(repoOwner, "repoOwner"),
      () => validateRepoIdentifier(repoName, "repoName"),
    ]);

    if (errors.length > 0) {
      return NextResponse.json(createValidationError(errors), { status: 400 });
    }

    const sanitizedName = sanitizeString(name, 100);

    const maxOrder = await prisma.album.aggregate({
      where: { userId: session.user.id, repoOwner, repoName },
      _max: { order: true },
    });

    const album = await prisma.album.create({
      data: {
        name: sanitizedName,
        repoOwner: sanitizeString(repoOwner, 100),
        repoName: sanitizeString(repoName, 100),
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

    const hasSubscription = await hasActiveSubscription(session.user.id);
    if (!hasSubscription) {
      return NextResponse.json({ error: "Subscription required" }, { status: 402 });
    }

    const body = await request.json();
    const { albumId, name, note, order } = body;

    // Validate albumId (required)
    const albumIdError = validateCuid(albumId, "albumId");
    if (albumIdError) {
      return NextResponse.json({ error: albumIdError }, { status: 400 });
    }

    // Validate optional fields
    const errors = validateAll([
      () => name !== undefined ? validateString(name, "name", { minLength: 1, maxLength: 100 }) : null,
      () => note !== undefined ? validateString(note, "note", { required: false, maxLength: 5000 }) : null,
      () => order !== undefined ? validatePositiveInt(order, "order", { max: 10000 }) : null,
    ]);

    if (errors.length > 0) {
      return NextResponse.json(createValidationError(errors), { status: 400 });
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
        ...(name !== undefined && { name: sanitizeString(name, 100) }),
        ...(note !== undefined && { note: sanitizeString(note, 5000) }),
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

    const hasSubscription = await hasActiveSubscription(session.user.id);
    if (!hasSubscription) {
      return NextResponse.json({ error: "Subscription required" }, { status: 402 });
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
