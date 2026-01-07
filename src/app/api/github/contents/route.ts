import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { fetchRepoContents, sortContents } from "@/lib/github";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const path = searchParams.get("path") || "";

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo parameter" },
        { status: 400 }
      );
    }

    const contents = await fetchRepoContents(
      session.user.accessToken,
      owner,
      repo,
      path
    );

    const sortedContents = sortContents(contents);

    return NextResponse.json(sortedContents);
  } catch (error) {
    console.error("Error fetching contents:", error);
    return NextResponse.json(
      { error: "Failed to fetch repository contents" },
      { status: 500 }
    );
  }
}
