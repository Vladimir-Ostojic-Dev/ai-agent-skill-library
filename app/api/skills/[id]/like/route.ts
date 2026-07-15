import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { extractTokenFromRequest, verifyToken } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getValidatedRequestData(request: NextRequest, rawId: string) {
  const skillId = parseInt(rawId, 10);

  if (isNaN(skillId)) {
    return { error: NextResponse.json({ error: "Invalid skill ID" }, { status: 400 }) };
  }

  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    select: { id: true, isPublic: true },
  });

  if (!skill) {
    return { error: NextResponse.json({ error: "Skill not found" }, { status: 404 }) };
  }

  if (!skill.isPublic) {
    return {
      error: NextResponse.json(
        { error: "You can only like public skills" },
        { status: 403 }
      ),
    };
  }

  const token = extractTokenFromRequest(request);
  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { skillId, userId: payload.userId };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const skillId = parseInt(id, 10);

    if (isNaN(skillId)) {
      return NextResponse.json({ error: "Invalid skill ID" }, { status: 400 });
    }

    const skill = await prisma.skill.findUnique({
      where: { id: skillId },
      select: { id: true, isPublic: true },
    });

    if (!skill || !skill.isPublic) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    const likesCount = await prisma.skillLike.count({ where: { skillId } });

    const token = extractTokenFromRequest(request);
    const payload = token ? verifyToken(token) : null;

    let likedByUser = false;
    if (payload) {
      const like = await prisma.skillLike.findUnique({
        where: {
          skillId_userId: {
            skillId,
            userId: payload.userId,
          },
        },
      });
      likedByUser = Boolean(like);
    }

    return NextResponse.json({ likesCount, likedByUser });
  } catch (error) {
    console.error("Get likes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const validated = await getValidatedRequestData(request, id);

    if ("error" in validated) {
      return validated.error;
    }

    const { skillId, userId } = validated;

    const likesCount = await prisma.$transaction(async (tx) => {
      await tx.skillLike.upsert({
        where: {
          skillId_userId: {
            skillId,
            userId,
          },
        },
        update: {},
        create: {
          skillId,
          userId,
        },
      });

      return tx.skillLike.count({ where: { skillId } });
    });

    revalidatePath("/skills");
    revalidatePath(`/skills/${skillId}`);

    return NextResponse.json({ likesCount, likedByUser: true });
  } catch (error) {
    console.error("Like skill error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const validated = await getValidatedRequestData(request, id);

    if ("error" in validated) {
      return validated.error;
    }

    const { skillId, userId } = validated;

    const likesCount = await prisma.$transaction(async (tx) => {
      await tx.skillLike.deleteMany({
        where: {
          skillId,
          userId,
        },
      });

      return tx.skillLike.count({ where: { skillId } });
    });

    revalidatePath("/skills");
    revalidatePath(`/skills/${skillId}`);

    return NextResponse.json({ likesCount, likedByUser: false });
  } catch (error) {
    console.error("Unlike skill error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}