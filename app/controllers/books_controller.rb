class BooksController < ApplicationController
  before_filter :find_user

  def create
    book = @user.books.create!(:guid => params[:guid], :name => params[:name], :author => params[:author], :size => params[:data].size)
    File.open("#{RAILS_ROOT}/public/upload/books/#{@user.device_sn}/#{book.id}", 'w') {|f| f.write params[:data] }
    render :nothing => true
  end

  def show
    book = @user.books.find(params[:id])
    redirect_to "/upload/books/#{book.user.device_sn}/#{book.id}?t=#{Time.now.to_i}"
  end

  def index
    @books = @user.books.paginate(:page => params[:page])
    render :action => :index, :layout => false
  end

  def update
    book = Book.find(params[:id])
    book.toggle!(:share) if book.user == @user
    render :nothing => true
  end

  def destroy
    book = Book.find(params[:id])
    book.destroy if book.user == @user
    render :nothing => true
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
