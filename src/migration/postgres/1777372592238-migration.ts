import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777372592238 implements MigrationInterface {
    name = 'Migration1777372592238'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "department" DROP CONSTRAINT "FK_7ae0dfd2411b5e2efc39cfafb48"`);
        await queryRunner.query(`ALTER TABLE "department" RENAME COLUMN "head_id" TO "headId"`);
        await queryRunner.query(`ALTER TABLE "department" ADD CONSTRAINT "FK_704562fff92144d2bc2ade1016a" FOREIGN KEY ("headId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "department" DROP CONSTRAINT "FK_704562fff92144d2bc2ade1016a"`);
        await queryRunner.query(`ALTER TABLE "department" RENAME COLUMN "headId" TO "head_id"`);
        await queryRunner.query(`ALTER TABLE "department" ADD CONSTRAINT "FK_7ae0dfd2411b5e2efc39cfafb48" FOREIGN KEY ("head_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
