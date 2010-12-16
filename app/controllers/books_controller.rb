class BooksController < ApplicationController
  before_filter :find_user

  def create
    book = @user.books.create!(:guid => params[:guid], :name => params[:name], :author => params[:author])
    File.open("#{RAILS_ROOT}/public/upload/books/#{@user.device_sn}/#{book.id}", 'w') {|f| f.write params[:data] }
    render :nothing => true
  end

  def show
    book = Book.find(params[:id])
    if book.share? || book.user == @user
      redirect_to "/upload/books/#{book.user.device_sn}/#{book.id}"
    else
      render :nothing => true, :status => 404
    end
  end

  def index
    books = @user.books
    respond_to do |format|
      format.json {render :json => books.to_json(:only => [:id, :name, :author, :share])}
    end
  end

  private
  def find_user
    @user = User.find_or_initialize_by_device_sn(params[:sn])
    if action_name == "create" && @user.new_record?
      @user.save!
      FileUtils.mkdir_p "#{RAILS_ROOT}/public/upload/books/#{@user.device_sn}"
    end
  end
end
