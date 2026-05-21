import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776605048557 implements MigrationInterface {
    name = 'Migration1776605048557'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_time_account" ADD "valid_from" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_time_account" DROP COLUMN "delta_hours"`);
        await queryRunner.query(`ALTER TABLE "user_time_account" ADD "delta_hours" double precision NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_time_account" DROP COLUMN "delta_hours"`);
        await queryRunner.query(`ALTER TABLE "user_time_account" ADD "delta_hours" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "user_time_account" DROP COLUMN "valid_from"`);
    }

}
