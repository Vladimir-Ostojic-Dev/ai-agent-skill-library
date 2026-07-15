-- CreateTable
CREATE TABLE "skill_likes" (
    "skill_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_likes_pkey" PRIMARY KEY ("skill_id", "user_id")
);

-- CreateIndex
CREATE INDEX "skill_likes_skill_id_idx" ON "skill_likes"("skill_id");

-- CreateIndex
CREATE INDEX "skill_likes_user_id_idx" ON "skill_likes"("user_id");

-- AddForeignKey
ALTER TABLE "skill_likes" ADD CONSTRAINT "skill_likes_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_likes" ADD CONSTRAINT "skill_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;