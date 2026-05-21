import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776940811309 implements MigrationInterface {
    name = 'Migration1776940811309'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."role_name_enum" RENAME TO "role_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."role_name_enum" AS ENUM('EMPLOYEE', 'DEPARTMENT_HEAD', 'HR_MANAGER', 'ACCOUNTANT', 'DEMO', 'IT_ADMINISTRATOR', 'EXECUTIVE')`);
        await queryRunner.query(`ALTER TABLE "role" ALTER COLUMN "name" TYPE "public"."role_name_enum" USING "name"::"text"::"public"."role_name_enum"`);
        await queryRunner.query(`DROP TYPE "public"."role_name_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."time_entry_type_enum" RENAME TO "time_entry_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."time_entry_type_enum" AS ENUM('WORK', 'VACATION', 'SICK', 'SICK_CHILD', 'EDUCATION', 'PUBLIC_HOLIDAY', 'COMPENSATORY_OFF', 'SPECIAL_LEAVE', 'PARENTAL_LEAVE', 'UNPAID_LEAVE')`);
        await queryRunner.query(`ALTER TABLE "time_entry" ALTER COLUMN "type" TYPE "public"."time_entry_type_enum" USING "type"::"text"::"public"."time_entry_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."time_entry_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."time_entry_type_enum_old" AS ENUM('WORK', 'VACATION', 'SICK', 'SICK_CHILD', 'EDUCATION', 'PUBLIC_HOLIDAY', 'COMPENSATORY_OFF', 'SPECIAL_LEAVE', 'PARENTAL_LEAVE', 'UNPAID_LEAVE', 'ON_CALL')`);
        await queryRunner.query(`ALTER TABLE "time_entry" ALTER COLUMN "type" TYPE "public"."time_entry_type_enum_old" USING "type"::"text"::"public"."time_entry_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."time_entry_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."time_entry_type_enum_old" RENAME TO "time_entry_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."role_name_enum_old" AS ENUM('EMPLOYEE', 'DEPARTMENT_HEAD', 'HR_MANAGER', 'ACCOUNTANT', 'IT_ADMINISTRATOR', 'EXECUTIVE')`);
        await queryRunner.query(`ALTER TABLE "role" ALTER COLUMN "name" TYPE "public"."role_name_enum_old" USING "name"::"text"::"public"."role_name_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."role_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."role_name_enum_old" RENAME TO "role_name_enum"`);
    }

}
