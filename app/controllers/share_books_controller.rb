class ShareBooksController < ApplicationController
  def index
    @books = ShareBook.paginate(:page => params[:page], :order => "#{params[:sort] == 'time' ? 'created_at' : 'download_count'} desc")
    render :action => :index, :layout => false
  end

  def show
    share_book = ShareBook.find(params[:id])
    share_book.increment!(:download_count)
    book = Book.find(share_book.first_share_book_id)
    redirect_to "/upload/books/#{book.user.device_sn}/#{book.id}?t=#{Time.now.to_i}"
  end
end
