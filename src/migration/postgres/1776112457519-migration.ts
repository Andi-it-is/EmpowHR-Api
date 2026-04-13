import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1776112457519 implements MigrationInterface {
    name = 'Migration1776112457519'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "permission" DROP COLUMN "entity"`);
        await queryRunner.query(`CREATE TYPE "public"."permission_entity_enum" AS ENUM('Certificate', 'Department', 'Document', 'TimeEntry', 'Token', 'User', 'UserMasterData', 'UserTimeAccount', 'Role', 'Permission', 'Location', 'BookableRessource', 'BookingRessourceEntry')`);

        await queryRunner.query(`ALTER TABLE "permission" ADD "entity" "public"."permission_entity_enum"`);
        await queryRunner.query(`UPDATE "permission" SET "entity" = 'Document' WHERE "entity" IS NULL`);
        await queryRunner.query(`ALTER TABLE "permission" ALTER COLUMN "entity" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "permission" DROP COLUMN "entity"`);
        await queryRunner.query(`DROP TYPE "public"."permission_entity_enum"`);
        await queryRunner.query(`ALTER TABLE "permission" ADD "entity" character varying NOT NULL`);
    }
}
