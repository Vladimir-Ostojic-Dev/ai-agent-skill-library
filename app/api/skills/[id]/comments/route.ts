import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { extractTokenFromRequest, verifyToken } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseSkillId(rawId: string) {
  const skillId = parseInt(rawId, 10);
  return Number.isNaN(skillId) ? null : skillId;
}

async function getSkillOrError(skillId: number) {
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
        { error: "You can only view comments on public skills" },
        { status: 403 }
      ),
    };
  }

  return { skill };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const skillId = parseSkillId(id);

    if (skillId === null) {
      return NextResponse.json({ error: "Invalid skill ID" }, { status: 400 });
    }

    const skillResult = await getSkillOrError(skillId);
    if ("error" in skillResult) {
      return skillResult.error;
    }

    const token = extractTokenFromRequest(request);
    const payload = token ? verifyToken(token) : null;

    const comments = await prisma.skillComment.findMany({
      where: { skillId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { likes: true },
        },
      },
    });

    const commentIds = comments.map((comment) => comment.id);
    const likedCommentIds = payload && commentIds.length > 0
      ? await prisma.skillCommentLike.findMany({
          where: {
            userId: payload.userId,
            commentId: { in: commentIds },
          },
          select: { commentId: true },
        })
      : [];

    const likedCommentIdSet = new Set(likedCommentIds.map((item) => item.commentId));

    return NextResponse.json({
      comments: comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: comment.author,
        likesCount: comment._count.likes,
        likedByUser: likedCommentIdSet.has(comment.id),
      })),
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const skillId = parseSkillId(id);

    if (skillId === null) {
      return NextResponse.json({ error: "Invalid skill ID" }, { status: 400 });
    }

    const skillResult = await getSkillOrError(skillId);
    if ("error" in skillResult) {
      return skillResult.error;
    }

    const token = extractTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { content?: string } | null;
    const content = body?.content?.trim();

    if (!content) {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: "Comment is too long" }, { status: 400 });
    }

    const comment = await prisma.skillComment.create({
      data: {
        content,
        skillId,
        authorId: payload.userId,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    revalidatePath(`/skills/${skillId}`);
    revalidatePath("/skills");

    return NextResponse.json({
      comment: {
        ...comment,
        likesCount: 0,
        likedByUser: false,
      },
    });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}