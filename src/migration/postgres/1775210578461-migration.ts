import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775210578461 implements MigrationInterface {
    name = 'Migration1775210578461'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."change_log_history_entity_table_name_enum" AS ENUM('Certificate', 'Department', 'Document', 'TimeEntry', 'Token', 'User', 'UserMasterData', 'UserTimeAccount', 'Role', 'Permission', 'Location', 'BookableRessource', 'BookingRessourceEntry')`);
        await queryRunner.query(`CREATE TYPE "public"."change_log_history_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE')`);
        await queryRunner.query(`CREATE TABLE "change_log_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "entity_table_name" "public"."change_log_history_entity_table_name_enum" NOT NULL, "entity_id" character varying NOT NULL, "action" "public"."change_log_history_action_enum" NOT NULL, "old_value" json, "new_value" json, "changed_by" json NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5b047109744862656ac6099d94d" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "change_log_history"`);
        await queryRunner.query(`DROP TYPE "public"."change_log_history_action_enum"`);
        await queryRunner.query(`DROP TYPE "public"."change_log_history_entity_table_name_enum"`);
    }

}
