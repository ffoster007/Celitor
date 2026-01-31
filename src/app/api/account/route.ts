import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
	const session = await getServerSession(authOptions);
	const userId = session?.user?.id;

	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		await prisma.user.delete({ where: { id: userId } });
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Delete account failed", error);
		return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
	}
}
