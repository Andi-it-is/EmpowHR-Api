import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776452800336 implements MigrationInterface {
    name = 'Migration1776452800336'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "department" ADD "head_id" uuid`);
        await queryRunner.query(`CREATE TYPE "public"."user_gender_enum" AS ENUM('male', 'female', '-')`);
        await queryRunner.query(`ALTER TABLE "user" ADD "gender" "public"."user_gender_enum" NOT NULL DEFAULT '-'`);
        await queryRunner.query(`ALTER TABLE "department" ADD CONSTRAINT "FK_7ae0dfd2411b5e2efc39cfafb48" FOREIGN KEY ("head_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "department" DROP CONSTRAINT "FK_7ae0dfd2411b5e2efc39cfafb48"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "gender"`);
        await queryRunner.query(`DROP TYPE "public"."user_gender_enum"`);
        await queryRunner.query(`ALTER TABLE "department" DROP COLUMN "head_id"`);
    }

}
