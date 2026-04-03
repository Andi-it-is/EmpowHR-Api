import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1775209528204 implements MigrationInterface {
    name = 'Migration1775209528204'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "location" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "street" character varying NOT NULL, "zipcode" character varying NOT NULL, "city" character varying NOT NULL, "country" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_876d7bdba03c72251ec4c2dc827" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "bookable_resource" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "level" integer, "building_section" integer, "room_number" integer, "label" character varying NOT NULL, "equipment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "locationId" uuid NOT NULL, CONSTRAINT "PK_efed0073f143d687df97ff9fcc1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "resource_booking_entry" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "bookableResourceId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_d1da3f2c2cfd19515411f254a0f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "bookable_resource" ADD CONSTRAINT "FK_b79045c3cfd9a809cdab4fc315a" FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resource_booking_entry" ADD CONSTRAINT "FK_bdf4802cc0800ddb63434df0121" FOREIGN KEY ("bookableResourceId") REFERENCES "bookable_resource"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resource_booking_entry" ADD CONSTRAINT "FK_05086f13f9150855961b5b37fdd" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "resource_booking_entry" DROP CONSTRAINT "FK_05086f13f9150855961b5b37fdd"`);
        await queryRunner.query(`ALTER TABLE "resource_booking_entry" DROP CONSTRAINT "FK_bdf4802cc0800ddb63434df0121"`);
        await queryRunner.query(`ALTER TABLE "bookable_resource" DROP CONSTRAINT "FK_b79045c3cfd9a809cdab4fc315a"`);
        await queryRunner.query(`DROP TABLE "resource_booking_entry"`);
        await queryRunner.query(`DROP TABLE "bookable_resource"`);
        await queryRunner.query(`DROP TABLE "location"`);
    }

}
