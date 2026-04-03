import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775208940172 implements MigrationInterface {
    name = 'Migration1775208940172'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "department" DROP CONSTRAINT "FK_110d56d702b0880fe9b005878e9"`);
        await queryRunner.query(`ALTER TABLE "department" RENAME COLUMN "parent_id" TO "parentId"`);
        await queryRunner.query(`ALTER TABLE "department" ADD CONSTRAINT "FK_c50480cad914f9afa0c5213c76c" FOREIGN KEY ("parentId") REFERENCES "department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "department" DROP CONSTRAINT "FK_c50480cad914f9afa0c5213c76c"`);
        await queryRunner.query(`ALTER TABLE "department" RENAME COLUMN "parentId" TO "parent_id"`);
        await queryRunner.query(`ALTER TABLE "department" ADD CONSTRAINT "FK_110d56d702b0880fe9b005878e9" FOREIGN KEY ("parent_id") REFERENCES "department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
