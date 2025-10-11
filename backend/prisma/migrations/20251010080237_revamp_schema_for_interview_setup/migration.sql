/*
  Warnings:

  - The `status` column on the `InterviewSession` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `domain` to the `InterviewSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interviewType` to the `InterviewSession` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Domain" AS ENUM ('FRONTEND', 'BACKEND', 'FULLSTACK', 'DATA_SCIENCE', 'MOBILE', 'DEVOPS');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "InterviewFormat" AS ENUM ('TEXT', 'VOICE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('SUCCESS', 'ERROR', 'TIMEOUT');

-- CreateEnum
CREATE TYPE "ProgrammingLanguage" AS ENUM ('JAVASCRIPT', 'TYPESCRIPT', 'PYTHON', 'JAVA', 'CSHARP', 'CPP', 'GO', 'RUST');

-- AlterTable
ALTER TABLE "InterviewQuestion" ADD COLUMN     "codingLanguage" "ProgrammingLanguage",
ADD COLUMN     "expectedOutput" TEXT,
ADD COLUMN     "isCodingQuestion" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "starterCode" TEXT;

-- AlterTable
ALTER TABLE "InterviewSession" ADD COLUMN     "difficulty" "Difficulty" NOT NULL DEFAULT 'INTERMEDIATE',
ADD COLUMN     "domain" "Domain" NOT NULL,
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "enableCodingSandbox" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "format" "InterviewFormat" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "interviewType" "InterviewType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- CreateTable
CREATE TABLE "TestCase" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "expectedOutput" TEXT NOT NULL,
    "description" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeExecution" (
    "id" SERIAL NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "questionId" INTEGER,
    "code" TEXT NOT NULL,
    "language" "ProgrammingLanguage" NOT NULL,
    "output" TEXT,
    "error" TEXT,
    "status" "ExecutionStatus" NOT NULL,
    "executionTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodeSubmission" (
    "id" SERIAL NOT NULL,
    "questionId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "language" "ProgrammingLanguage" NOT NULL,
    "isCorrect" BOOLEAN,
    "passedTests" INTEGER NOT NULL DEFAULT 0,
    "totalTests" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodeSubmission_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestCase" ADD CONSTRAINT "TestCase_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "InterviewQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeExecution" ADD CONSTRAINT "CodeExecution_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodeSubmission" ADD CONSTRAINT "CodeSubmission_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "InterviewQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
