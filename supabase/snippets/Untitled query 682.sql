 SELECT email, email_confirmed_at, last_sign_in_at, encrypted_password IS NOT NULL as has_password
  FROM auth.users;