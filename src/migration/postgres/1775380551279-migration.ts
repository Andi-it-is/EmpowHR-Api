import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775380551279 implements MigrationInterface {
    name = 'Migration1775380551279'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token" DROP COLUMN "type"`);
        await queryRunner.query(`CREATE TYPE "public"."token_type_enum" AS ENUM('ACCESS', 'REFRESH')`);
        await queryRunner.query(`ALTER TABLE "token" ADD "type" "public"."token_type_enum" NOT NULL DEFAULT 'ACCESS'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."token_type_enum"`);
        await queryRunner.query(`ALTER TABLE "token" ADD "type" character varying NOT NULL DEFAULT 'ACCESS'`);
    }

}
