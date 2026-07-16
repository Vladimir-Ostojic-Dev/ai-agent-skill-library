import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { extractTokenFromRequest, verifyToken } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getCommentContext(request: NextRequest, rawId: string) {
  const commentId = parseInt(rawId, 10);

  if (Number.isNaN(commentId)) {
    return { error: NextResponse.json({ error: "Invalid comment ID" }, { status: 400 }) };
  }

  const comment = await prisma.skillComment.findUnique({
    where: { id: commentId },
    select: {
      id: true,
      skillId: true,
      skill: {
        select: { isPublic: true },
      },
    },
  });

  if (!comment) {
    return { error: NextResponse.json({ error: "Comment not found" }, { status: 404 }) };
  }

  if (!comment.skill.isPublic) {
    return { error: NextResponse.json({ error: "Comment not found" }, { status: 404 }) };
  }

  const token = extractTokenFromRequest(request);
  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { commentId, skillId: comment.skillId, userId: payload.userId };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const validated = await getCommentContext(request, id);

    if ("error" in validated) {
      return validated.error;
    }

    const { commentId, skillId, userId } = validated;

    const likesCount = await prisma.$transaction(async (tx) => {
      await tx.skillCommentLike.upsert({
        where: {
          commentId_userId: {
            commentId,
            userId,
          },
        },
        update: {},
        create: {
          commentId,
          userId,
        },
      });

      return tx.skillCommentLike.count({ where: { commentId } });
    });

    revalidatePath(`/skills/${skillId}`);
    revalidatePath("/skills");

    return NextResponse.json({ likesCount, likedByUser: true });
  } catch (error) {
    console.error("Like comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const validated = await getCommentContext(request, id);

    if ("error" in validated) {
      return validated.error;
    }

    const { commentId, skillId, userId } = validated;

    const likesCount = await prisma.$transaction(async (tx) => {
      await tx.skillCommentLike.deleteMany({
        where: {
          commentId,
          userId,
        },
      });

      return tx.skillCommentLike.count({ where: { commentId } });
    });

    revalidatePath(`/skills/${skillId}`);
    revalidatePath("/skills");

    return NextResponse.json({ likesCount, likedByUser: false });
  } catch (error) {
    console.error("Unlike comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}