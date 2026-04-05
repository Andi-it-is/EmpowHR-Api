import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775380413885 implements MigrationInterface {
    name = 'Migration1775380413885'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "type" SET DEFAULT 'ACCESS'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "type" DROP DEFAULT`);
    }

}
