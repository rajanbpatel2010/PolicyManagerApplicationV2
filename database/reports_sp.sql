USE PolicyManagerDB;
GO

-- 1. Stored Procedure for Summary Report
CREATE OR ALTER PROCEDURE usp_Report_PolicySummary
    @StartDate DATETIME2 = NULL,
    @EndDate   DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Group by Policy Type and Status
    SELECT 
        pt.Name AS PolicyType,
        p.Status,
        COUNT(p.Id) AS PolicyCount,
        SUM(p.PremiumAmount) AS TotalPremium,
        SUM(p.CoverageAmount) AS TotalCoverage,
        AVG(p.PremiumAmount) AS AvgPremium
    FROM PolicyTypes pt
    INNER JOIN Policies p ON pt.Id = p.PolicyTypeId
    WHERE p.IsDeleted = 0
      AND (@StartDate IS NULL OR p.CreatedAt >= @StartDate)
      AND (@EndDate IS NULL OR p.CreatedAt <= @EndDate)
    GROUP BY pt.Name, p.Status
    ORDER BY pt.Name, p.Status;
END
GO

-- 2. Stored Procedure for Detail Register Report
CREATE OR ALTER PROCEDURE usp_Report_PolicyRegister
    @SearchTerm     NVARCHAR(200) = NULL,
    @PolicyTypeId   INT = NULL,
    @Status         NVARCHAR(20) = NULL,
    @StartDateFrom  DATETIME2 = NULL,
    @StartDateTo    DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        p.PolicyNumber,
        p.PolicyHolderName,
        p.Email,
        p.PhoneNumber,
        pt.Name AS PolicyTypeName,
        p.PremiumAmount,
        p.CoverageAmount,
        p.StartDate,
        p.EndDate,
        p.Status,
        p.NomineeName,
        p.NomineeRelation,
        p.Description,
        p.CreatedAt,
        u.FullName AS CreatedBy
    FROM Policies p
    INNER JOIN PolicyTypes pt ON p.PolicyTypeId = pt.Id
    LEFT JOIN Users u ON p.CreatedByUserId = u.Id
    WHERE p.IsDeleted = 0
      AND (@SearchTerm IS NULL OR 
           p.PolicyNumber LIKE '%' + @SearchTerm + '%' OR
           p.PolicyHolderName LIKE '%' + @SearchTerm + '%' OR
           p.Email LIKE '%' + @SearchTerm + '%')
      AND (@PolicyTypeId IS NULL OR p.PolicyTypeId = @PolicyTypeId)
      AND (@Status IS NULL OR p.Status = @Status)
      AND (@StartDateFrom IS NULL OR p.StartDate >= @StartDateFrom)
      AND (@StartDateTo IS NULL OR p.StartDate <= @StartDateTo)
    ORDER BY p.CreatedAt DESC;
END
GO
