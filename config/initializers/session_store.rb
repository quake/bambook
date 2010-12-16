# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_bambook_session',
  :secret      => 'c7ed5a160b3f3e05a5f2e2f927f2f5e1f8a749886f094c2f8463ce32cc52019d7372c9e970b81cfec8bb1733c92bea5a913d145cd553798e8cbc2ed84a9e6282'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
