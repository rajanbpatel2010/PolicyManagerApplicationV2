USE PolicyManagerDB;
GO

/*
  Performance Optimization: Filtered Index for Policies
  This index optimizes reports by indexing only non-deleted (Active) records.
  It includes columns frequently used in WHERE and GROUP BY clauses.
*/

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Policies_Reporting_Filtered' AND object_id = OBJECT_ID('Policies'))
BEGIN
    CREATE INDEX IX_Policies_Reporting_Filtered
    ON Policies (IsDeleted, PolicyTypeId, Status, CreatedAt)
    INCLUDE (PremiumAmount, CoverageAmount, PolicyNumber, PolicyHolderName)
    WHERE IsDeleted = 0;
END
GO

PRINT 'Filtered index for reporting created successfully.';
GO
