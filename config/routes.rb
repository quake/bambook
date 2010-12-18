ActionController::Routing::Routes.draw do |map|
  map.home '/', :controller => 'application'

  map.resources :books
  map.resources :share_books
end
