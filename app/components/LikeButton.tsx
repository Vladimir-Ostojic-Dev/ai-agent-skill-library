"use client";

import { useState } from "react";

interface LikeButtonProps {
  skillId: number;
  initialLikesCount: number;
  initialLikedByUser: boolean;
  canLike: boolean;
}

export default function LikeButton({
  skillId,
  initialLikesCount,
  initialLikedByUser,
  canLike,
}: LikeButtonProps) {
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [likedByUser, setLikedByUser] = useState(initialLikedByUser);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleLike = async () => {
    if (!canLike) {
      window.location.href = "/login";
      return;
    }

    if (isSubmitting) {
      return;
    }

    const nextLikedState = !likedByUser;
    const previousLikedState = likedByUser;
    const previousLikesCount = likesCount;

    setLikedByUser(nextLikedState);
    setLikesCount((count) => Math.max(0, count + (nextLikedState ? 1 : -1)));
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/skills/${skillId}/like`, {
        method: nextLikedState ? "POST" : "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(data.error || "Failed to update like");
      }

      const data: { likesCount: number; likedByUser: boolean } = await response.json();
      setLikesCount(data.likesCount);
      setLikedByUser(data.likedByUser);
    } catch (error) {
      setLikedByUser(previousLikedState);
      setLikesCount(previousLikesCount);

      const message = error instanceof Error ? error.message : "Failed to update like";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      className={`btn btn-sm ${likedByUser ? "btn-primary" : "btn-outline"}`}
      onClick={handleToggleLike}
      disabled={isSubmitting}
      aria-label={likedByUser ? "Unlike skill" : "Like skill"}
    >
      {isSubmitting ? (
        <span className="loading loading-spinner loading-xs"></span>
      ) : (
        <span>{likedByUser ? "♥" : "♡"}</span>
      )}
      <span>{likesCount}</span>
    </button>
  );
}