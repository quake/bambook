class CreateBooks < ActiveRecord::Migration
  def self.up
    create_table :books do |t|
      t.string :name, :author, :guid
      t.integer :user_id
      t.boolean :share, :default => false
      t.integer :size
      t.timestamps
    end

    add_index :books, :user_id
  end

  def self.down
    drop_table :books
  end
end
