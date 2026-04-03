import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775211854237 implements MigrationInterface {
    name = 'Migration1775211854237'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."change_log_history_entity_table_name_enum" RENAME TO "change_log_history_entity_table_name_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."change_log_history_entity_table_name_enum" AS ENUM('certificate', 'cepartment', 'document', 'timeEntry', 'token', 'user', 'user_master_data', 'User_time_account', 'role', 'permission', 'location', 'bookable_ressource', 'booking_ressource_entry')`);
        await queryRunner.query(`ALTER TABLE "change_log_history" ALTER COLUMN "entity_table_name" TYPE "public"."change_log_history_entity_table_name_enum" USING "entity_table_name"::"text"::"public"."change_log_history_entity_table_name_enum"`);
        await queryRunner.query(`DROP TYPE "public"."change_log_history_entity_table_name_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."change_log_history_entity_table_name_enum_old" AS ENUM('Certificate', 'Department', 'Document', 'TimeEntry', 'Token', 'User', 'UserMasterData', 'UserTimeAccount', 'Role', 'Permission', 'Location', 'BookableRessource', 'BookingRessourceEntry')`);
        await queryRunner.query(`ALTER TABLE "change_log_history" ALTER COLUMN "entity_table_name" TYPE "public"."change_log_history_entity_table_name_enum_old" USING "entity_table_name"::"text"::"public"."change_log_history_entity_table_name_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."change_log_history_entity_table_name_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."change_log_history_entity_table_name_enum_old" RENAME TO "change_log_history_entity_table_name_enum"`);
    }

}
