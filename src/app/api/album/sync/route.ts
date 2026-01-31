import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { hasActiveSubscription } from "@/lib/billing";
import { checkForkStatus } from "@/lib/github";

// POST - Sync albums from parent repository to forked repository
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasSubscription = await hasActiveSubscription(session.user.id);
    if (!hasSubscription) {
      return NextResponse.json({ error: "Subscription required" }, { status: 402 });
    }

    const body = await request.json();
    const { repoOwner, repoName } = body;

    if (!repoOwner || !repoName) {
      return NextResponse.json({ error: "Missing repository info" }, { status: 400 });
    }

    // Check if current repo is a fork
    const forkInfo = await checkForkStatus(session.user.accessToken, repoOwner, repoName);

    if (!forkInfo.isFork || !forkInfo.sourceOwner || !forkInfo.sourceName) {
      return NextResponse.json({ 
        error: "Repository is not a fork or parent info unavailable",
        data: { isFork: false }
      }, { status: 400 });
    }

    // Find all albums from the source repository (created by any user)
    // These are albums that are marked as shareable from the parent repo
    const sourceAlbums = await prisma.album.findMany({
      where: {
        repoOwner: forkInfo.sourceOwner,
        repoName: forkInfo.sourceName,
        isShared: false, // Only original albums, not already synced ones
      },
      include: {
        items: { orderBy: { order: "asc" } },
        groups: { include: { items: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } },
      },
      orderBy: { order: "asc" },
    });

    if (sourceAlbums.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No albums found in parent repository",
        data: { syncedCount: 0, albums: [] }
      });
    }

    const syncedAlbums = [];

    for (const sourceAlbum of sourceAlbums) {
      // Check if this album is already synced for this user
      const existingSync = await prisma.album.findFirst({
        where: {
          userId: session.user.id,
          repoOwner,
          repoName,
          sourceAlbumId: sourceAlbum.id,
        },
      });

      if (existingSync) {
        // Update existing synced album
        const updatedAlbum = await prisma.album.update({
          where: { id: existingSync.id },
          data: {
            name: sourceAlbum.name,
            note: sourceAlbum.note,
            lastSyncedAt: new Date(),
          },
          include: {
            items: { orderBy: { order: "asc" } },
            groups: { include: { items: { orderBy: { order: "asc" } } } },
          },
        });

        // Sync items - delete old items and create new ones
        await prisma.albumItem.deleteMany({ where: { albumId: existingSync.id } });
        await prisma.albumGroup.deleteMany({ where: { albumId: existingSync.id } });

        // Recreate groups
        const groupIdMap = new Map<string, string>();
        for (const sourceGroup of sourceAlbum.groups) {
          const newGroup = await prisma.albumGroup.create({
            data: {
              name: sourceGroup.name,
              note: sourceGroup.note,
              order: sourceGroup.order,
              albumId: existingSync.id,
            },
          });
          groupIdMap.set(sourceGroup.id, newGroup.id);
        }

        // Recreate items
        for (const sourceItem of sourceAlbum.items) {
          await prisma.albumItem.create({
            data: {
              path: sourceItem.path,
              name: sourceItem.name,
              type: sourceItem.type,
              note: sourceItem.note,
              order: sourceItem.order,
              albumId: existingSync.id,
              groupId: sourceItem.groupId ? groupIdMap.get(sourceItem.groupId) : null,
            },
          });
        }

        // Also recreate items within groups
        for (const sourceGroup of sourceAlbum.groups) {
          for (const sourceItem of sourceGroup.items) {
            await prisma.albumItem.create({
              data: {
                path: sourceItem.path,
                name: sourceItem.name,
                type: sourceItem.type,
                note: sourceItem.note,
                order: sourceItem.order,
                albumId: existingSync.id,
                groupId: groupIdMap.get(sourceGroup.id),
              },
            });
          }
        }

        // Refetch the updated album with all relations
        const finalAlbum = await prisma.album.findUnique({
          where: { id: existingSync.id },
          include: {
            items: { orderBy: { order: "asc" } },
            groups: { include: { items: { orderBy: { order: "asc" } } } },
          },
        });

        syncedAlbums.push(finalAlbum);
      } else {
        // Get max order for new album
        const maxOrder = await prisma.album.aggregate({
          where: { userId: session.user.id, repoOwner, repoName },
          _max: { order: true },
        });

        // Create new synced album
        const newAlbum = await prisma.album.create({
          data: {
            name: sourceAlbum.name,
            repoOwner,
            repoName,
            note: sourceAlbum.note,
            order: (maxOrder._max.order ?? -1) + 1,
            userId: session.user.id,
            sourceRepoOwner: forkInfo.sourceOwner,
            sourceRepoName: forkInfo.sourceName,
            sourceAlbumId: sourceAlbum.id,
            isShared: true,
            lastSyncedAt: new Date(),
          },
        });

        // Create groups
        const groupIdMap = new Map<string, string>();
        for (const sourceGroup of sourceAlbum.groups) {
          const newGroup = await prisma.albumGroup.create({
            data: {
              name: sourceGroup.name,
              note: sourceGroup.note,
              order: sourceGroup.order,
              albumId: newAlbum.id,
            },
          });
          groupIdMap.set(sourceGroup.id, newGroup.id);
        }

        // Create items (ungrouped)
        for (const sourceItem of sourceAlbum.items) {
          await prisma.albumItem.create({
            data: {
              path: sourceItem.path,
              name: sourceItem.name,
              type: sourceItem.type,
              note: sourceItem.note,
              order: sourceItem.order,
              albumId: newAlbum.id,
              groupId: sourceItem.groupId ? groupIdMap.get(sourceItem.groupId) : null,
            },
          });
        }

        // Create items within groups
        for (const sourceGroup of sourceAlbum.groups) {
          for (const sourceItem of sourceGroup.items) {
            await prisma.albumItem.create({
              data: {
                path: sourceItem.path,
                name: sourceItem.name,
                type: sourceItem.type,
                note: sourceItem.note,
                order: sourceItem.order,
                albumId: newAlbum.id,
                groupId: groupIdMap.get(sourceGroup.id),
              },
            });
          }
        }

        // Refetch the new album with all relations
        const finalAlbum = await prisma.album.findUnique({
          where: { id: newAlbum.id },
          include: {
            items: { orderBy: { order: "asc" } },
            groups: { include: { items: { orderBy: { order: "asc" } } } },
          },
        });

        syncedAlbums.push(finalAlbum);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedAlbums.length} album(s) from ${forkInfo.sourceOwner}/${forkInfo.sourceName}`,
      data: {
        syncedCount: syncedAlbums.length,
        albums: syncedAlbums,
        sourceRepo: {
          owner: forkInfo.sourceOwner,
          name: forkInfo.sourceName,
        },
      },
    });
  } catch (error) {
    console.error("Album sync error:", error);
    return NextResponse.json({ error: "Failed to sync albums" }, { status: 500 });
  }
}

// GET - Check if current repo is a fork and get parent album info
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session?.user?.accessToken) {
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

    // Check if current repo is a fork
    const forkInfo = await checkForkStatus(session.user.accessToken, repoOwner, repoName);

    if (!forkInfo.isFork) {
      return NextResponse.json({
        success: true,
        data: {
          isFork: false,
          availableAlbums: 0,
        },
      });
    }

    // Count available albums from parent repo
    const availableAlbums = await prisma.album.count({
      where: {
        repoOwner: forkInfo.sourceOwner!,
        repoName: forkInfo.sourceName!,
        isShared: false,
      },
    });

    // Count already synced albums for this user
    const syncedAlbums = await prisma.album.count({
      where: {
        userId: session.user.id,
        repoOwner,
        repoName,
        isShared: true,
        sourceRepoOwner: forkInfo.sourceOwner,
        sourceRepoName: forkInfo.sourceName,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        isFork: true,
        parentRepo: {
          owner: forkInfo.parentOwner,
          name: forkInfo.parentName,
        },
        sourceRepo: {
          owner: forkInfo.sourceOwner,
          name: forkInfo.sourceName,
        },
        availableAlbums,
        syncedAlbums,
        canSync: availableAlbums > 0,
      },
    });
  } catch (error) {
    console.error("Album sync check error:", error);
    return NextResponse.json({ error: "Failed to check fork status" }, { status: 500 });
  }
}
