<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260111235239 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE inventory_likes (inventory_id UUID NOT NULL, user_id UUID NOT NULL, PRIMARY KEY (inventory_id, user_id))');
        $this->addSql('CREATE INDEX IDX_9556E57D9EEA759 ON inventory_likes (inventory_id)');
        $this->addSql('CREATE INDEX IDX_9556E57DA76ED395 ON inventory_likes (user_id)');
        $this->addSql('ALTER TABLE inventory_likes ADD CONSTRAINT FK_9556E57D9EEA759 FOREIGN KEY (inventory_id) REFERENCES inventories (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inventory_likes ADD CONSTRAINT FK_9556E57DA76ED395 FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inventories ADD view_count INT DEFAULT 0 NOT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE inventory_likes DROP CONSTRAINT FK_9556E57D9EEA759');
        $this->addSql('ALTER TABLE inventory_likes DROP CONSTRAINT FK_9556E57DA76ED395');
        $this->addSql('DROP TABLE inventory_likes');
        $this->addSql('ALTER TABLE inventories DROP view_count');
    }
}
