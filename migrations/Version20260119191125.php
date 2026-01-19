<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260119191125 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE integration_profiles (id UUID NOT NULL, provider VARCHAR(255) NOT NULL, external_user_id VARCHAR(255) DEFAULT NULL, external_account_id VARCHAR(255) DEFAULT NULL, data JSON DEFAULT NULL, last_synced_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, user_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_99EA40DAA76ED395 ON integration_profiles (user_id)');
        $this->addSql('ALTER TABLE integration_profiles ADD CONSTRAINT FK_99EA40DAA76ED395 FOREIGN KEY (user_id) REFERENCES "users" (id) NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE integration_profiles DROP CONSTRAINT FK_99EA40DAA76ED395');
        $this->addSql('DROP TABLE integration_profiles');
    }
}
