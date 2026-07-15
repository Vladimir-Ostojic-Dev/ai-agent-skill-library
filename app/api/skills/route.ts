import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Get token from httpOnly cookie
    const token = request.cookies.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skills = await prisma.skill.findMany({
      where: { authorId: payload.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        isPublic: true,
        createdAt: true,
        _count: {
          select: { likes: true },
        },
      },
    });

    const skillsWithLikes = skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      isPublic: skill.isPublic,
      createdAt: skill.createdAt,
      likesCount: skill._count.likes,
    }));

    return NextResponse.json({ skills: skillsWithLikes });
  } catch (error) {
    console.error("Get skills error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}