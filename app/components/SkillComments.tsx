"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

interface CommentAuthor {
  id: number;
  name: string | null;
}

interface CommentItem {
  id: number;
  content: string;
  createdAt: string;
  author: CommentAuthor;
  likesCount: number;
  likedByUser: boolean;
}

interface SkillCommentsProps {
  skillId: number;
  canComment: boolean;
}

function CommentLikeButton({
  commentId,
  likesCount,
  likedByUser,
  canLike,
  onChange,
}: {
  commentId: number;
  likesCount: number;
  likedByUser: boolean;
  canLike: boolean;
  onChange: (next: { likesCount: number; likedByUser: boolean }) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = async () => {
    if (!canLike) {
      window.location.href = "/login";
      return;
    }

    if (isSubmitting) {
      return;
    }

    const nextLikedState = !likedByUser;
    const previousLikesCount = likesCount;

    onChange({
      likesCount: Math.max(0, likesCount + (nextLikedState ? 1 : -1)),
      likedByUser: nextLikedState,
    });

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: nextLikedState ? "POST" : "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(data.error || "Failed to update comment like");
      }

      const data: { likesCount: number; likedByUser: boolean } = await response.json();
      onChange(data);
    } catch (error) {
      onChange({ likesCount: previousLikesCount, likedByUser });
      const message = error instanceof Error ? error.message : "Failed to update comment like";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      className={`btn btn-xs ${likedByUser ? "btn-primary" : "btn-ghost"}`}
      onClick={handleToggle}
      disabled={isSubmitting}
      aria-label={likedByUser ? "Unlike comment" : "Like comment"}
    >
      {isSubmitting ? <span className="loading loading-spinner loading-xs"></span> : <span>{likedByUser ? "♥" : "♡"}</span>}
      <span>{likesCount}</span>
    </button>
  );
}

export default function SkillComments({ skillId, canComment }: SkillCommentsProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async (): Promise<CommentItem[]> => {
    const response = await fetch(`/api/skills/${skillId}/comments`, {
      credentials: "include",
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Failed to load comments" }));
      throw new Error(data.error || "Failed to load comments");
    }

    const data: { comments: CommentItem[] } = await response.json();
    return data.comments || [];
  }, [skillId]);

  useEffect(() => {
    const initializeComments = async () => {
      try {
        setError(null);
        const nextComments = await fetchComments();
        setComments(nextComments);
      } catch (requestError) {
        const message = requestError instanceof Error ? requestError.message : "Failed to load comments";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void initializeComments();
  }, [fetchComments, skillId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canComment) {
      window.location.href = "/login";
      return;
    }

    if (!commentText.trim() || isPosting) {
      return;
    }

    setIsPosting(true);
    try {
      const response = await fetch(`/api/skills/${skillId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: commentText }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Failed to post comment" }));
        throw new Error(data.error || "Failed to post comment");
      }

      setCommentText("");
      setComments(await fetchComments());
    } catch (postError) {
      const message = postError instanceof Error ? postError.message : "Failed to post comment";
      alert(message);
    } finally {
      setIsPosting(false);
    }
  };

  const updateComment = (commentId: number, next: { likesCount: number; likedByUser: boolean }) => {
    setComments((current) =>
      current.map((comment) =>
        comment.id === commentId ? { ...comment, ...next } : comment
      )
    );
  };

  return (
    <section className="mt-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Comments</h2>
        <p className="text-base-content/70">Discuss this skill and react to useful comments.</p>
      </div>

      {canComment ? (
        <form onSubmit={handleSubmit} className="card bg-base-200 shadow-lg">
          <div className="card-body gap-4">
            <textarea
              className="textarea textarea-bordered w-full min-h-28"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              maxLength={1000}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-base-content/60">
                {commentText.length}/1000
              </span>
              <button type="submit" className="btn btn-primary btn-sm" disabled={isPosting || !commentText.trim()}>
                {isPosting ? <span className="loading loading-spinner loading-xs"></span> : "Post comment"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="alert">
          <span>Sign in to post a comment or like other comments.</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((item) => (
            <div key={item} className="card bg-base-200">
              <div className="card-body">
                <div className="skeleton h-4 w-1/4"></div>
                <div className="skeleton h-4 w-full mt-3"></div>
                <div className="skeleton h-4 w-2/3 mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : comments.length === 0 ? (
        <div className="card bg-base-200">
          <div className="card-body text-center py-10">
            <p className="text-base-content/70">No comments yet. Be the first to start the discussion.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="card bg-base-200 shadow-md">
              <div className="card-body gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{comment.author.name ?? "Anonymous"}</h3>
                    <p className="text-xs text-base-content/60">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <CommentLikeButton
                    commentId={comment.id}
                    likesCount={comment.likesCount}
                    likedByUser={comment.likedByUser}
                    canLike={canComment}
                    onChange={(next) => updateComment(comment.id, next)}
                  />
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}