class Book < ActiveRecord::Base
  belongs_to :user

  def after_update
    if share_change == [false, true]
      #check if anyone has shared this book already
      share_book = ShareBook.find_or_initialize_by_guid_and_name_and_author_and_size(self.guid, self.name, self.author, self.size)
      share_book.update_attributes!(:first_share_book_id => self.id) if share_book.new_record?
    elsif share_change == [true, false]
      ShareBook.find_all_by_guid_and_first_share_book_id(self.guid, self.id).each { |i| i.destroy }
    end
  end
end
