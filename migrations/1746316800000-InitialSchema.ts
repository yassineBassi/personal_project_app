import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1746316800000 implements MigrationInterface {
  name = 'InitialSchema1746316800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "urls" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "originalUrl" character varying NOT NULL,
        "code" character varying(8) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_urls_code" UNIQUE ("code"),
        CONSTRAINT "PK_urls_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "url_clicks" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "clientIp" character varying NOT NULL,
        "clientBrowser" character varying NOT NULL,
        "clientDeviceType" character varying NOT NULL,
        "clientOS" character varying NOT NULL,
        "time" TIMESTAMP NOT NULL,
        "urlId" uuid,
        CONSTRAINT "PK_url_clicks_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "url_clicks"
        DROP CONSTRAINT IF EXISTS "FK_url_clicks_urlId"
    `);
    await queryRunner.query(`
      ALTER TABLE "url_clicks"
        ADD CONSTRAINT "FK_url_clicks_urlId"
        FOREIGN KEY ("urlId") REFERENCES "urls"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "url_clicks" DROP CONSTRAINT "FK_url_clicks_urlId"`);
    await queryRunner.query(`DROP TABLE "url_clicks"`);
    await queryRunner.query(`DROP TABLE "urls"`);
  }
}
