-- Educa School System starter schema and data for XAMPP / phpMyAdmin
-- Import this file into MySQL after creating or selecting your XAMPP connection.
-- Starter login for seeded users:
-- email: admin@educa.school
-- password: Admin@12345

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS `educa_school`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `educa_school`;

DROP TABLE IF EXISTS `GradeEntry`;
DROP TABLE IF EXISTS `Assessment`;
DROP TABLE IF EXISTS `AttendanceRecord`;
DROP TABLE IF EXISTS `Enrollment`;
DROP TABLE IF EXISTS `TeacherSubject`;
DROP TABLE IF EXISTS `ClassSubject`;
DROP TABLE IF EXISTS `Subject`;
DROP TABLE IF EXISTS `SchoolClass`;
DROP TABLE IF EXISTS `Term`;
DROP TABLE IF EXISTS `AcademicYear`;
DROP TABLE IF EXISTS `Teacher`;
DROP TABLE IF EXISTS `Student`;
DROP TABLE IF EXISTS `User`;

CREATE TABLE `User` (
  `id` VARCHAR(191) NOT NULL,
  `firstName` VARCHAR(191) NOT NULL,
  `lastName` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `passwordHash` VARCHAR(191) NOT NULL,
  `role` ENUM('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'PARENT') NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Student` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `admissionNumber` VARCHAR(191) NOT NULL,
  `dateOfBirth` DATETIME(3) NULL,
  `guardianName` VARCHAR(191) NULL,
  `guardianPhone` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Student_userId_key` (`userId`),
  UNIQUE KEY `Student_admissionNumber_key` (`admissionNumber`),
  CONSTRAINT `Student_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Teacher` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `employeeCode` VARCHAR(191) NOT NULL,
  `phoneNumber` VARCHAR(191) NULL,
  `qualification` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Teacher_userId_key` (`userId`),
  UNIQUE KEY `Teacher_employeeCode_key` (`employeeCode`),
  CONSTRAINT `Teacher_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `AcademicYear` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `AcademicYear_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Term` (
  `id` VARCHAR(191) NOT NULL,
  `academicYearId` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `startDate` DATETIME(3) NOT NULL,
  `endDate` DATETIME(3) NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Term_academicYearId_name_key` (`academicYearId`, `name`),
  CONSTRAINT `Term_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SchoolClass` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `level` VARCHAR(191) NOT NULL,
  `section` VARCHAR(191) NULL,
  `classTeacherId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SchoolClass_name_section_key` (`name`, `section`),
  CONSTRAINT `SchoolClass_classTeacherId_fkey` FOREIGN KEY (`classTeacherId`) REFERENCES `Teacher` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Subject` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Subject_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ClassSubject` (
  `id` VARCHAR(191) NOT NULL,
  `schoolClassId` VARCHAR(191) NOT NULL,
  `subjectId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ClassSubject_schoolClassId_subjectId_key` (`schoolClassId`, `subjectId`),
  CONSTRAINT `ClassSubject_schoolClassId_fkey` FOREIGN KEY (`schoolClassId`) REFERENCES `SchoolClass` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ClassSubject_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `TeacherSubject` (
  `id` VARCHAR(191) NOT NULL,
  `teacherId` VARCHAR(191) NOT NULL,
  `subjectId` VARCHAR(191) NOT NULL,
  `schoolClassId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `TeacherSubject_teacherId_subjectId_schoolClassId_key` (`teacherId`, `subjectId`, `schoolClassId`),
  CONSTRAINT `TeacherSubject_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `Teacher` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TeacherSubject_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `TeacherSubject_schoolClassId_fkey` FOREIGN KEY (`schoolClassId`) REFERENCES `SchoolClass` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Enrollment` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `schoolClassId` VARCHAR(191) NOT NULL,
  `academicYearId` VARCHAR(191) NOT NULL,
  `status` ENUM('ACTIVE', 'TRANSFERRED', 'GRADUATED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Enrollment_studentId_schoolClassId_academicYearId_key` (`studentId`, `schoolClassId`, `academicYearId`),
  CONSTRAINT `Enrollment_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Enrollment_schoolClassId_fkey` FOREIGN KEY (`schoolClassId`) REFERENCES `SchoolClass` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Enrollment_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `AttendanceRecord` (
  `id` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `schoolClassId` VARCHAR(191) NOT NULL,
  `academicYearId` VARCHAR(191) NOT NULL,
  `termId` VARCHAR(191) NULL,
  `recordedById` VARCHAR(191) NULL,
  `date` DATETIME(3) NOT NULL,
  `status` ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED') NOT NULL DEFAULT 'PRESENT',
  `remarks` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `AttendanceRecord_studentId_schoolClassId_date_key` (`studentId`, `schoolClassId`, `date`),
  KEY `AttendanceRecord_schoolClassId_date_idx` (`schoolClassId`, `date`),
  CONSTRAINT `AttendanceRecord_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `AttendanceRecord_schoolClassId_fkey` FOREIGN KEY (`schoolClassId`) REFERENCES `SchoolClass` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `AttendanceRecord_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `AttendanceRecord_termId_fkey` FOREIGN KEY (`termId`) REFERENCES `Term` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `AttendanceRecord_recordedById_fkey` FOREIGN KEY (`recordedById`) REFERENCES `Teacher` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Assessment` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `type` ENUM('ASSIGNMENT', 'QUIZ', 'EXAM', 'PROJECT') NOT NULL,
  `status` ENUM('DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
  `subjectId` VARCHAR(191) NOT NULL,
  `schoolClassId` VARCHAR(191) NOT NULL,
  `academicYearId` VARCHAR(191) NOT NULL,
  `termId` VARCHAR(191) NULL,
  `assignedById` VARCHAR(191) NULL,
  `totalMarks` INT NOT NULL DEFAULT 100,
  `dueDate` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Assessment_schoolClassId_subjectId_idx` (`schoolClassId`, `subjectId`),
  CONSTRAINT `Assessment_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `Subject` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Assessment_schoolClassId_fkey` FOREIGN KEY (`schoolClassId`) REFERENCES `SchoolClass` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Assessment_academicYearId_fkey` FOREIGN KEY (`academicYearId`) REFERENCES `AcademicYear` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Assessment_termId_fkey` FOREIGN KEY (`termId`) REFERENCES `Term` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Assessment_assignedById_fkey` FOREIGN KEY (`assignedById`) REFERENCES `Teacher` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `GradeEntry` (
  `id` VARCHAR(191) NOT NULL,
  `assessmentId` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `marks` DECIMAL(5,2) NULL,
  `remarks` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `GradeEntry_assessmentId_studentId_key` (`assessmentId`, `studentId`),
  CONSTRAINT `GradeEntry_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `Assessment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `GradeEntry_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `Student` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `User` (`id`, `firstName`, `lastName`, `email`, `passwordHash`, `role`, `isActive`) VALUES
  ('usr_admin_001', 'Amina', 'Mollel', 'admin@educa.school', '$2b$10$TgnaJkNqEw8XJ78TeUWaMebDHjv30P7skT5dFapOIDBqCT9TEImAW', 'SUPER_ADMIN', 1),
  ('usr_teacher_001', 'Rehema', 'Msuya', 'rehema@educa.school', '$2b$10$TgnaJkNqEw8XJ78TeUWaMebDHjv30P7skT5dFapOIDBqCT9TEImAW', 'TEACHER', 1),
  ('usr_teacher_002', 'Bahati', 'Kileo', 'bahati@educa.school', '$2b$10$TgnaJkNqEw8XJ78TeUWaMebDHjv30P7skT5dFapOIDBqCT9TEImAW', 'TEACHER', 1),
  ('usr_student_001', 'Neema', 'Mollel', 'neema@educa.school', '$2b$10$TgnaJkNqEw8XJ78TeUWaMebDHjv30P7skT5dFapOIDBqCT9TEImAW', 'STUDENT', 1),
  ('usr_student_002', 'Juma', 'Kileo', 'juma@educa.school', '$2b$10$TgnaJkNqEw8XJ78TeUWaMebDHjv30P7skT5dFapOIDBqCT9TEImAW', 'STUDENT', 1),
  ('usr_student_003', 'Sofia', 'Said', 'sofia@educa.school', '$2b$10$TgnaJkNqEw8XJ78TeUWaMebDHjv30P7skT5dFapOIDBqCT9TEImAW', 'STUDENT', 1);

INSERT INTO `Teacher` (`id`, `userId`, `employeeCode`, `phoneNumber`, `qualification`) VALUES
  ('tea_001', 'usr_teacher_001', 'EMP-001', '+255700000101', 'B.Ed Mathematics'),
  ('tea_002', 'usr_teacher_002', 'EMP-002', '+255700000102', 'B.Sc Education');

INSERT INTO `AcademicYear` (`id`, `name`, `startDate`, `endDate`, `isActive`) VALUES
  ('ay_2026_2027', '2026/2027', '2026-01-05 00:00:00.000', '2026-12-04 00:00:00.000', 1);

INSERT INTO `Term` (`id`, `academicYearId`, `name`, `startDate`, `endDate`, `isActive`) VALUES
  ('term_sem1', 'ay_2026_2027', 'Semester One', '2026-01-05 00:00:00.000', '2026-06-12 00:00:00.000', 1),
  ('term_sem2', 'ay_2026_2027', 'Semester Two', '2026-06-29 00:00:00.000', '2026-12-04 00:00:00.000', 0);

INSERT INTO `SchoolClass` (`id`, `name`, `level`, `section`, `classTeacherId`) VALUES
  ('class_grade7a', 'Grade 7', 'Lower Secondary', 'A', 'tea_002'),
  ('class_grade8a', 'Grade 8', 'Lower Secondary', 'A', 'tea_001'),
  ('class_grade10b', 'Grade 10', 'Upper Secondary', 'B', 'tea_001');

INSERT INTO `Subject` (`id`, `name`, `code`, `description`) VALUES
  ('subj_math', 'Mathematics', 'MATH', 'Core mathematics curriculum'),
  ('subj_science', 'Science', 'SCI', 'Integrated sciences'),
  ('subj_english', 'English', 'ENG', 'Language and writing'),
  ('subj_ict', 'ICT', 'ICT', 'Computer studies and digital skills');

INSERT INTO `ClassSubject` (`id`, `schoolClassId`, `subjectId`) VALUES
  ('cls_sub_001', 'class_grade7a', 'subj_math'),
  ('cls_sub_002', 'class_grade7a', 'subj_english'),
  ('cls_sub_003', 'class_grade8a', 'subj_science'),
  ('cls_sub_004', 'class_grade8a', 'subj_math'),
  ('cls_sub_005', 'class_grade10b', 'subj_math'),
  ('cls_sub_006', 'class_grade10b', 'subj_ict');

INSERT INTO `TeacherSubject` (`id`, `teacherId`, `subjectId`, `schoolClassId`) VALUES
  ('tea_sub_001', 'tea_001', 'subj_math', 'class_grade10b'),
  ('tea_sub_002', 'tea_001', 'subj_science', 'class_grade8a'),
  ('tea_sub_003', 'tea_002', 'subj_english', 'class_grade7a'),
  ('tea_sub_004', 'tea_002', 'subj_ict', 'class_grade10b');

INSERT INTO `Student` (`id`, `userId`, `admissionNumber`, `dateOfBirth`, `guardianName`, `guardianPhone`) VALUES
  ('stu_001', 'usr_student_001', 'ADM-2026-001', '2012-03-11 00:00:00.000', 'Mollel Joseph', '+255700100001'),
  ('stu_002', 'usr_student_002', 'ADM-2026-002', '2011-08-19 00:00:00.000', 'Kileo Peter', '+255700100002'),
  ('stu_003', 'usr_student_003', 'ADM-2026-003', '2012-01-27 00:00:00.000', 'Said Rehema', '+255700100003');

INSERT INTO `Enrollment` (`id`, `studentId`, `schoolClassId`, `academicYearId`, `status`) VALUES
  ('enr_001', 'stu_001', 'class_grade7a', 'ay_2026_2027', 'ACTIVE'),
  ('enr_002', 'stu_002', 'class_grade8a', 'ay_2026_2027', 'ACTIVE'),
  ('enr_003', 'stu_003', 'class_grade10b', 'ay_2026_2027', 'ACTIVE');

INSERT INTO `AttendanceRecord` (`id`, `studentId`, `schoolClassId`, `academicYearId`, `termId`, `recordedById`, `date`, `status`, `remarks`) VALUES
  ('att_001', 'stu_001', 'class_grade7a', 'ay_2026_2027', 'term_sem1', 'tea_002', '2026-03-20 00:00:00.000', 'PRESENT', NULL),
  ('att_002', 'stu_002', 'class_grade8a', 'ay_2026_2027', 'term_sem1', 'tea_001', '2026-03-20 00:00:00.000', 'LATE', 'Arrived after assembly'),
  ('att_003', 'stu_003', 'class_grade10b', 'ay_2026_2027', 'term_sem1', 'tea_001', '2026-03-20 00:00:00.000', 'ABSENT', 'Guardian follow-up required');

INSERT INTO `Assessment` (`id`, `title`, `type`, `status`, `subjectId`, `schoolClassId`, `academicYearId`, `termId`, `assignedById`, `totalMarks`, `dueDate`) VALUES
  ('asm_001', 'Grade 10 Mathematics CAT', 'QUIZ', 'PUBLISHED', 'subj_math', 'class_grade10b', 'ay_2026_2027', 'term_sem1', 'tea_001', 100, '2026-03-28 00:00:00.000'),
  ('asm_002', 'Grade 8 Science Practical', 'PROJECT', 'OPEN', 'subj_science', 'class_grade8a', 'ay_2026_2027', 'term_sem1', 'tea_001', 100, '2026-04-02 00:00:00.000');

INSERT INTO `GradeEntry` (`id`, `assessmentId`, `studentId`, `marks`, `remarks`) VALUES
  ('grd_001', 'asm_001', 'stu_003', 78.50, 'Solid performance'),
  ('grd_002', 'asm_002', 'stu_002', 84.00, 'Strong practical execution'),
  ('grd_003', 'asm_001', 'stu_001', 69.00, 'Needs improvement in algebra');

SET FOREIGN_KEY_CHECKS = 1;
