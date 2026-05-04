-- Run this only if you already created the database before this update.
-- It makes chat_conversations work without a linked item (general chat).

ALTER TABLE chat_conversations ALTER COLUMN item_id DROP NOT NULL;
ALTER TABLE chat_conversations ALTER COLUMN item_type DROP NOT NULL;
