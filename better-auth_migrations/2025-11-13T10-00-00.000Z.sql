alter table "user"
  add column "role" text not null default 'user';

update "user"
  set "role" = 'user'
  where "role" is null;
