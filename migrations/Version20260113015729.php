<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260113015729 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE activities (id UUID NOT NULL, type VARCHAR(30) NOT NULL, is_admin_action BOOLEAN DEFAULT false NOT NULL, metadata JSON DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, inventory_id UUID NOT NULL, user_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_B5F1AFE59EEA759 ON activities (inventory_id)');
        $this->addSql('CREATE INDEX IDX_B5F1AFE5A76ED395 ON activities (user_id)');
        $this->addSql('CREATE INDEX idx_activity_inventory_type ON activities (inventory_id, type, created_at)');
        $this->addSql('ALTER TABLE activities ADD CONSTRAINT FK_B5F1AFE59EEA759 FOREIGN KEY (inventory_id) REFERENCES inventories (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE activities ADD CONSTRAINT FK_B5F1AFE5A76ED395 FOREIGN KEY (user_id) REFERENCES "users" (id) NOT DEFERRABLE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE activities DROP CONSTRAINT FK_B5F1AFE59EEA759');
        $this->addSql('ALTER TABLE activities DROP CONSTRAINT FK_B5F1AFE5A76ED395');
        $this->addSql('DROP TABLE activities');
    }
}
