ActionController::Routing::Routes.draw do |map|
  map.home '/', :controller => 'application'

  map.resources :books, :collection => {:uploaded => :get}
  map.resources :share_books
  map.resources :subscriptions
end
