ALTER TABLE "VerificationProofs" ALTER COLUMN "IsDeleted" TYPE boolean USING ("IsDeleted"::int::boolean);

