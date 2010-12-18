class CreateShareBooks < ActiveRecord::Migration
  def self.up
    create_table :share_books do |t|
      t.string :guid, :name, :author
      t.string :abstract, :limit => 2000
      t.integer :size
      t.integer :download_count, :default => 0
      t.integer :first_share_book_id
      t.timestamps
    end

    add_index :share_books, :guid
  end

  def self.down
    drop_table :share_books
  end
end
