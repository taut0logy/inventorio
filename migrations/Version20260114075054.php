<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260114075054 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE items ADD custom_select1_value VARCHAR(500) DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_select2_value VARCHAR(500) DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_select3_value VARCHAR(500) DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE items DROP custom_select1_value');
        $this->addSql('ALTER TABLE items DROP custom_select2_value');
        $this->addSql('ALTER TABLE items DROP custom_select3_value');
    }
}
