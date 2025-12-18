alter table "sell_submission"
  add column "status" text not null default 'pending';

update "sell_submission"
  set "status" = 'pending'
  where "status" is null;

