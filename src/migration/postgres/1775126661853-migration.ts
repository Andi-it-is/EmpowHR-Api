import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775126661853 implements MigrationInterface {
    name = 'Migration1775126661853'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_master_data" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_alias" character varying NOT NULL, "street" character varying NOT NULL, "zipcode" character varying NOT NULL, "city" character varying NOT NULL, "country" character varying NOT NULL, "date_of_birth" character varying(10) NOT NULL, "telephone_business" character varying NOT NULL, "telephone_private" character varying, "banking_detail" character varying NOT NULL, "job_title" character varying, "started_working_date" character varying(10) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "UQ_4d081b75c342ee5c9b6731ff1d9" UNIQUE ("company_alias"), CONSTRAINT "REL_ed83e5cad14a3f1779f6516eac" UNIQUE ("userId"), CONSTRAINT "PK_77ed2a79d8db695b68dd2f94718" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."document_type_enum" AS ENUM('CONTRACT', 'FINANCE', 'ABSENCE', 'QUALIFICATION', 'COMPLIANCE')`);
        await queryRunner.query(`CREATE TYPE "public"."document_security_level_enum" AS ENUM('1', '2', '3', '4')`);
        await queryRunner.query(`CREATE TABLE "document" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "type" "public"."document_type_enum" NOT NULL, "security_level" "public"."document_security_level_enum" NOT NULL DEFAULT '1', "file_path" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_e57d3357f83f3cdc0acffc3d777" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "certificate" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" character varying, "file_path" character varying NOT NULL, "issued_at" TIMESTAMP, "expires_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_8daddfc65f59e341c2bbc9c9e43" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "department" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "cost_center" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "parent_id" uuid, CONSTRAINT "PK_9a2213262c1593bffb581e382f5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."time_entry_working_location_enum" AS ENUM('OFFICE', 'REMOTE', 'FIELD_SERVICE')`);
        await queryRunner.query(`CREATE TYPE "public"."time_entry_type_enum" AS ENUM('WORK', 'VACATION', 'SICK', 'SICK_CHILD', 'EDUCATION', 'PUBLIC_HOLIDAY', 'COMPENSATORY_OFF', 'SPECIAL_LEAVE', 'PARENTAL_LEAVE', 'UNPAID_LEAVE', 'ON_CALL')`);
        await queryRunner.query(`CREATE TABLE "time_entry" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "working_location" "public"."time_entry_working_location_enum", "type" "public"."time_entry_type_enum" NOT NULL, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "interruption_hours" double precision NOT NULL DEFAULT '0', "recorded_hours" double precision NOT NULL DEFAULT '0', "is_confirmed" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "timeAccountId" uuid, CONSTRAINT "PK_8bc1870af1779c749f9026ec508" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_time_account" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "contract_hours_per_week" double precision NOT NULL DEFAULT '40', "working_days_per_week" double precision NOT NULL DEFAULT '5', "vacation_days_per_year" double precision NOT NULL DEFAULT '30', "delta_hours" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "REL_cfe66cc9164b9baa1d5a587f11" UNIQUE ("userId"), CONSTRAINT "PK_15883c96ae9ae6df52bc8e30d5d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" ADD "supervisorId" uuid`);
        await queryRunner.query(`ALTER TABLE "user" ADD "departmentId" uuid`);
        await queryRunner.query(`ALTER TABLE "user_master_data" ADD CONSTRAINT "FK_ed83e5cad14a3f1779f6516eac1" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "document" ADD CONSTRAINT "FK_7424ddcbdf1e9b067669eb0d3fd" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "certificate" ADD CONSTRAINT "FK_52422eba9e5b9d779d3e173a25d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "department" ADD CONSTRAINT "FK_110d56d702b0880fe9b005878e9" FOREIGN KEY ("parent_id") REFERENCES "department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_5eee61d80509271c4bd366995ec" FOREIGN KEY ("supervisorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_3d6915a33798152a079997cad28" FOREIGN KEY ("departmentId") REFERENCES "department"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "time_entry" ADD CONSTRAINT "FK_1162cac777e1f1742ef0333773a" FOREIGN KEY ("timeAccountId") REFERENCES "user_time_account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_time_account" ADD CONSTRAINT "FK_cfe66cc9164b9baa1d5a587f11a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_time_account" DROP CONSTRAINT "FK_cfe66cc9164b9baa1d5a587f11a"`);
        await queryRunner.query(`ALTER TABLE "time_entry" DROP CONSTRAINT "FK_1162cac777e1f1742ef0333773a"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_3d6915a33798152a079997cad28"`);
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_5eee61d80509271c4bd366995ec"`);
        await queryRunner.query(`ALTER TABLE "department" DROP CONSTRAINT "FK_110d56d702b0880fe9b005878e9"`);
        await queryRunner.query(`ALTER TABLE "certificate" DROP CONSTRAINT "FK_52422eba9e5b9d779d3e173a25d"`);
        await queryRunner.query(`ALTER TABLE "document" DROP CONSTRAINT "FK_7424ddcbdf1e9b067669eb0d3fd"`);
        await queryRunner.query(`ALTER TABLE "user_master_data" DROP CONSTRAINT "FK_ed83e5cad14a3f1779f6516eac1"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "departmentId"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "supervisorId"`);
        await queryRunner.query(`DROP TABLE "user_time_account"`);
        await queryRunner.query(`DROP TABLE "time_entry"`);
        await queryRunner.query(`DROP TYPE "public"."time_entry_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."time_entry_working_location_enum"`);
        await queryRunner.query(`DROP TABLE "department"`);
        await queryRunner.query(`DROP TABLE "certificate"`);
        await queryRunner.query(`DROP TABLE "document"`);
        await queryRunner.query(`DROP TYPE "public"."document_security_level_enum"`);
        await queryRunner.query(`DROP TYPE "public"."document_type_enum"`);
        await queryRunner.query(`DROP TABLE "user_master_data"`);
    }

}
