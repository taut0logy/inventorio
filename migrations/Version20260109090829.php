<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260109090829 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE item_likes (item_id UUID NOT NULL, user_id UUID NOT NULL, PRIMARY KEY (item_id, user_id))');
        $this->addSql('CREATE INDEX IDX_636D55AD126F525E ON item_likes (item_id)');
        $this->addSql('CREATE INDEX IDX_636D55ADA76ED395 ON item_likes (user_id)');
        $this->addSql('ALTER TABLE item_likes ADD CONSTRAINT FK_636D55AD126F525E FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE item_likes ADD CONSTRAINT FK_636D55ADA76ED395 FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE item_likes DROP CONSTRAINT FK_636D55AD126F525E');
        $this->addSql('ALTER TABLE item_likes DROP CONSTRAINT FK_636D55ADA76ED395');
        $this->addSql('DROP TABLE item_likes');
    }
}
