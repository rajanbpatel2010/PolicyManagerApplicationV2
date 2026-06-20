IF EXISTS (SELECT * FROM sys.objects WHERE name = 'CK_Policies_Status' AND parent_object_id = OBJECT_ID('Policies'))
BEGIN
    ALTER TABLE Policies DROP CONSTRAINT CK_Policies_Status;
    PRINT '✅ Dropped restrictive Status constraint.';
END
GO

-- Also ensure the column allows longer status names if needed
IF EXISTS (SELECT * FROM sys.columns WHERE Name = 'Status' AND Object_ID = Object_ID('Policies'))
BEGIN
    ALTER TABLE Policies ALTER COLUMN Status NVARCHAR(50) NOT NULL;
    PRINT '✅ Expanded Status column to 50 chars.';
END
GO
