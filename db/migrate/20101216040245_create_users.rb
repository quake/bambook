class CreateUsers < ActiveRecord::Migration
  def self.up
    create_table :users do |t|
      t.string :device_sn, :password
      t.timestamps
    end

    add_index :users, :device_sn
  end

  def self.down
    drop_table :users
  end
end
