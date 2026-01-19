<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260119143027 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Implement EAV pattern for unlimited custom fields: Creates inventory_fields and item_field_values tables, removes 18 fixed custom field columns from items table, removes custom_fields_config from inventories table.';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE "comments" (id UUID NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, user_id UUID NOT NULL, inventory_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_5F9E962AA76ED395 ON "comments" (user_id)');
        $this->addSql('CREATE INDEX IDX_5F9E962A9EEA759 ON "comments" (inventory_id)');
        $this->addSql('CREATE TABLE inventory_tags (inventory_id UUID NOT NULL, tag_id UUID NOT NULL, PRIMARY KEY (inventory_id, tag_id))');
        $this->addSql('CREATE INDEX IDX_251A5B089EEA759 ON inventory_tags (inventory_id)');
        $this->addSql('CREATE INDEX IDX_251A5B08BAD26311 ON inventory_tags (tag_id)');
        $this->addSql('CREATE TABLE inventory_shared_users (inventory_id UUID NOT NULL, user_id UUID NOT NULL, PRIMARY KEY (inventory_id, user_id))');
        $this->addSql('CREATE INDEX IDX_E14265E99EEA759 ON inventory_shared_users (inventory_id)');
        $this->addSql('CREATE INDEX IDX_E14265E9A76ED395 ON inventory_shared_users (user_id)');
        $this->addSql('CREATE TABLE inventory_fields (id UUID NOT NULL, type VARCHAR(20) NOT NULL, label VARCHAR(255) NOT NULL, description TEXT DEFAULT NULL, position INT NOT NULL, hidden BOOLEAN NOT NULL, is_required BOOLEAN NOT NULL, regex VARCHAR(500) DEFAULT NULL, min NUMERIC(15, 4) DEFAULT NULL, max NUMERIC(15, 4) DEFAULT NULL, options JSON DEFAULT NULL, inventory_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_7E397F239EEA759 ON inventory_fields (inventory_id)');
        $this->addSql('CREATE INDEX idx_field_order ON inventory_fields (inventory_id, position)');
        $this->addSql('CREATE TABLE item_field_values (id UUID NOT NULL, string_value TEXT DEFAULT NULL, number_value NUMERIC(15, 4) DEFAULT NULL, bool_value BOOLEAN DEFAULT NULL, item_id UUID NOT NULL, field_id UUID NOT NULL, PRIMARY KEY (id))');
        $this->addSql('CREATE INDEX IDX_DFB93D25126F525E ON item_field_values (item_id)');
        $this->addSql('CREATE INDEX IDX_DFB93D25443707B0 ON item_field_values (field_id)');
        $this->addSql('CREATE INDEX idx_string_value ON item_field_values (string_value)');
        $this->addSql('CREATE UNIQUE INDEX unique_item_field ON item_field_values (item_id, field_id)');
        $this->addSql('CREATE TABLE item_tags (item_id UUID NOT NULL, tag_id UUID NOT NULL, PRIMARY KEY (item_id, tag_id))');
        $this->addSql('CREATE INDEX IDX_A78CD0DD126F525E ON item_tags (item_id)');
        $this->addSql('CREATE INDEX IDX_A78CD0DDBAD26311 ON item_tags (tag_id)');
        $this->addSql('ALTER TABLE "comments" ADD CONSTRAINT FK_5F9E962AA76ED395 FOREIGN KEY (user_id) REFERENCES "users" (id) NOT DEFERRABLE');
        $this->addSql('ALTER TABLE "comments" ADD CONSTRAINT FK_5F9E962A9EEA759 FOREIGN KEY (inventory_id) REFERENCES inventories (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE inventory_tags ADD CONSTRAINT FK_251A5B089EEA759 FOREIGN KEY (inventory_id) REFERENCES inventories (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inventory_tags ADD CONSTRAINT FK_251A5B08BAD26311 FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inventory_shared_users ADD CONSTRAINT FK_E14265E99EEA759 FOREIGN KEY (inventory_id) REFERENCES inventories (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inventory_shared_users ADD CONSTRAINT FK_E14265E9A76ED395 FOREIGN KEY (user_id) REFERENCES "users" (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE inventory_fields ADD CONSTRAINT FK_7E397F239EEA759 FOREIGN KEY (inventory_id) REFERENCES inventories (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE item_field_values ADD CONSTRAINT FK_DFB93D25126F525E FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE item_field_values ADD CONSTRAINT FK_DFB93D25443707B0 FOREIGN KEY (field_id) REFERENCES inventory_fields (id) ON DELETE CASCADE NOT DEFERRABLE');
        $this->addSql('ALTER TABLE item_tags ADD CONSTRAINT FK_A78CD0DD126F525E FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE item_tags ADD CONSTRAINT FK_A78CD0DDBAD26311 FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE');
        $this->addSql('ALTER TABLE categories ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE inventories DROP custom_fields_config');
        $this->addSql('ALTER TABLE items DROP custom_string1_value');
        $this->addSql('ALTER TABLE items DROP custom_string2_value');
        $this->addSql('ALTER TABLE items DROP custom_string3_value');
        $this->addSql('ALTER TABLE items DROP custom_text1_value');
        $this->addSql('ALTER TABLE items DROP custom_text2_value');
        $this->addSql('ALTER TABLE items DROP custom_text3_value');
        $this->addSql('ALTER TABLE items DROP custom_number1_value');
        $this->addSql('ALTER TABLE items DROP custom_number2_value');
        $this->addSql('ALTER TABLE items DROP custom_number3_value');
        $this->addSql('ALTER TABLE items DROP custom_link1_value');
        $this->addSql('ALTER TABLE items DROP custom_link2_value');
        $this->addSql('ALTER TABLE items DROP custom_link3_value');
        $this->addSql('ALTER TABLE items DROP custom_bool1_value');
        $this->addSql('ALTER TABLE items DROP custom_bool2_value');
        $this->addSql('ALTER TABLE items DROP custom_bool3_value');
        $this->addSql('ALTER TABLE items DROP custom_select1_value');
        $this->addSql('ALTER TABLE items DROP custom_select2_value');
        $this->addSql('ALTER TABLE items DROP custom_select3_value');
        $this->addSql('ALTER TABLE tags ADD deleted_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE "comments" DROP CONSTRAINT FK_5F9E962AA76ED395');
        $this->addSql('ALTER TABLE "comments" DROP CONSTRAINT FK_5F9E962A9EEA759');
        $this->addSql('ALTER TABLE inventory_tags DROP CONSTRAINT FK_251A5B089EEA759');
        $this->addSql('ALTER TABLE inventory_tags DROP CONSTRAINT FK_251A5B08BAD26311');
        $this->addSql('ALTER TABLE inventory_shared_users DROP CONSTRAINT FK_E14265E99EEA759');
        $this->addSql('ALTER TABLE inventory_shared_users DROP CONSTRAINT FK_E14265E9A76ED395');
        $this->addSql('ALTER TABLE inventory_fields DROP CONSTRAINT FK_7E397F239EEA759');
        $this->addSql('ALTER TABLE item_field_values DROP CONSTRAINT FK_DFB93D25126F525E');
        $this->addSql('ALTER TABLE item_field_values DROP CONSTRAINT FK_DFB93D25443707B0');
        $this->addSql('ALTER TABLE item_tags DROP CONSTRAINT FK_A78CD0DD126F525E');
        $this->addSql('ALTER TABLE item_tags DROP CONSTRAINT FK_A78CD0DDBAD26311');
        $this->addSql('DROP TABLE "comments"');
        $this->addSql('DROP TABLE inventory_tags');
        $this->addSql('DROP TABLE inventory_shared_users');
        $this->addSql('DROP TABLE inventory_fields');
        $this->addSql('DROP TABLE item_field_values');
        $this->addSql('DROP TABLE item_tags');
        $this->addSql('ALTER TABLE categories DROP deleted_at');
        $this->addSql('ALTER TABLE inventories ADD custom_fields_config JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_string1_value VARCHAR(500) DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_string2_value VARCHAR(500) DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_string3_value VARCHAR(500) DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_text1_value TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_text2_value TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_text3_value TEXT DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_number1_value NUMERIC(15, 4) DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_number2_value NUMERIC(15, 4) DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_number3_value NUMERIC(15, 4) DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_link1_value VARCHAR(1000) DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_link2_value VARCHAR(1000) DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_link3_value VARCHAR(1000) DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_bool1_value BOOLEAN DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_bool2_value BOOLEAN DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_bool3_value BOOLEAN DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_select1_value VARCHAR(500) DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_select2_value VARCHAR(500) DEFAULT NULL');
        $this->addSql('ALTER TABLE items ADD custom_select3_value VARCHAR(500) DEFAULT NULL');
        $this->addSql('ALTER TABLE tags DROP deleted_at');
    }
}
