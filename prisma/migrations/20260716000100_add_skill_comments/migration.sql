-- CreateTable
CREATE TABLE "skill_comments" (
    "id" SERIAL NOT NULL,
    "content" VARCHAR(1000) NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "author_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_comment_likes" (
    "comment_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_comment_likes_pkey" PRIMARY KEY ("comment_id", "user_id")
);

-- CreateIndex
CREATE INDEX "skill_comments_skill_id_created_at_idx" ON "skill_comments"("skill_id", "created_at");

-- CreateIndex
CREATE INDEX "skill_comments_author_id_idx" ON "skill_comments"("author_id");

-- CreateIndex
CREATE INDEX "skill_comment_likes_comment_id_idx" ON "skill_comment_likes"("comment_id");

-- CreateIndex
CREATE INDEX "skill_comment_likes_user_id_idx" ON "skill_comment_likes"("user_id");

-- AddForeignKey
ALTER TABLE "skill_comments" ADD CONSTRAINT "skill_comments_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_comments" ADD CONSTRAINT "skill_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_comment_likes" ADD CONSTRAINT "skill_comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "skill_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_comment_likes" ADD CONSTRAINT "skill_comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;