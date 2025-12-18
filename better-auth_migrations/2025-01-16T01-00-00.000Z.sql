create table "lessor_submission" (
  "id" text not null primary key,
  "userId" text not null references "user" ("id") on delete cascade,
  "fullName" text not null,
  "phoneNumber" text not null,
  "woreda" text not null,
  "kebele" text not null,
  "village" text not null,
  "identityDocumentUrl" text not null,
  "homeMapUrl" text not null,
  "status" text not null default 'pending',
  "createdAt" date not null,
  "updatedAt" date not null
);

