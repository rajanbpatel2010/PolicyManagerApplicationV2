-- ═══════════════════════════════════════════════════════════════
--  POLICY MANAGER DATABASE SETUP SCRIPT
--  Run this script on SQL Server to create the database,
--  tables, indexes, stored procedures, and seed data.
--  
--  NOTE: If using EF Core migrations (recommended), you can skip
--  this script — the app auto-migrates on startup. This script
--  is provided as an alternative manual setup option.
-- ═══════════════════════════════════════════════════════════════

-- ── CREATE DATABASE ────────────────────────────────────────────
USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'PolicyManagerDB')
BEGIN
    CREATE DATABASE PolicyManagerDB;
END
GO

USE PolicyManagerDB;
GO

-- ── CREATE TABLES ──────────────────────────────────────────────

-- Policy Types (lookup table)
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PolicyTypes' AND xtype='U')
BEGIN
    CREATE TABLE PolicyTypes (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        Name            NVARCHAR(100)   NOT NULL,
        Description     NVARCHAR(500)   NULL,
        IsActive        BIT             NOT NULL DEFAULT 1
    );
END
GO

-- Users
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        FullName        NVARCHAR(100)   NOT NULL,
        Email           NVARCHAR(200)   NOT NULL,
        PasswordHash    NVARCHAR(MAX)   NOT NULL,
        Role            NVARCHAR(20)    NOT NULL DEFAULT 'User',
        PhoneNumber     NVARCHAR(20)    NULL,
        IsActive        BIT             NOT NULL DEFAULT 1,
        CreatedAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
        LastLoginAt     DATETIME2       NULL,
        
        CONSTRAINT UQ_Users_Email UNIQUE (Email)
    );
END
GO

-- Policies
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Policies' AND xtype='U')
BEGIN
    CREATE TABLE Policies (
        Id                  INT IDENTITY(1,1) PRIMARY KEY,
        PolicyNumber        NVARCHAR(50)    NOT NULL,
        PolicyHolderName    NVARCHAR(200)   NOT NULL,
        Email               NVARCHAR(200)   NOT NULL,
        PhoneNumber         NVARCHAR(20)    NULL,
        PolicyTypeId        INT             NOT NULL,
        PremiumAmount       DECIMAL(18,2)   NOT NULL,
        CoverageAmount      DECIMAL(18,2)   NOT NULL,
        StartDate           DATETIME2       NOT NULL,
        EndDate             DATETIME2       NOT NULL,
        Status              NVARCHAR(20)    NOT NULL DEFAULT 'Active',
        Description         NVARCHAR(1000)  NULL,
        NomineeName         NVARCHAR(500)   NULL,
        NomineeRelation     NVARCHAR(200)   NULL,
        CreatedAt           DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
        UpdatedAt           DATETIME2       NULL,
        CreatedByUserId     INT             NULL,
        IsDeleted           BIT             NOT NULL DEFAULT 0,
        
        CONSTRAINT UQ_Policies_PolicyNumber UNIQUE (PolicyNumber),
        CONSTRAINT FK_Policies_PolicyType FOREIGN KEY (PolicyTypeId) 
            REFERENCES PolicyTypes(Id) ON DELETE NO ACTION,
        CONSTRAINT FK_Policies_CreatedBy FOREIGN KEY (CreatedByUserId) 
            REFERENCES Users(Id) ON DELETE SET NULL,
        CONSTRAINT CK_Policies_Status CHECK (Status IN ('Active','Pending','Expired','Cancelled'))
    );
END
GO

-- Audit Logs
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AuditLogs' AND xtype='U')
BEGIN
    CREATE TABLE AuditLogs (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        Action          NVARCHAR(100)   NOT NULL,
        EntityName      NVARCHAR(100)   NOT NULL,
        EntityId        INT             NULL,
        OldValues       NVARCHAR(MAX)   NULL,
        NewValues       NVARCHAR(MAX)   NULL,
        UserId          INT             NULL,
        IpAddress       NVARCHAR(50)    NULL,
        Timestamp       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
        
        CONSTRAINT FK_AuditLogs_User FOREIGN KEY (UserId) 
            REFERENCES Users(Id) ON DELETE SET NULL
    );
END
GO

-- ── INDEXES ────────────────────────────────────────────────────
CREATE NONCLUSTERED INDEX IX_Policies_Status ON Policies(Status) WHERE IsDeleted = 0;
CREATE NONCLUSTERED INDEX IX_Policies_Email ON Policies(Email) WHERE IsDeleted = 0;
CREATE NONCLUSTERED INDEX IX_Policies_PolicyTypeId ON Policies(PolicyTypeId) WHERE IsDeleted = 0;
CREATE NONCLUSTERED INDEX IX_Policies_CreatedAt ON Policies(CreatedAt DESC) WHERE IsDeleted = 0;
CREATE NONCLUSTERED INDEX IX_Policies_IsDeleted ON Policies(IsDeleted);
CREATE NONCLUSTERED INDEX IX_AuditLogs_Timestamp ON AuditLogs(Timestamp DESC);
CREATE NONCLUSTERED INDEX IX_AuditLogs_EntityName ON AuditLogs(EntityName);
GO

-- ── SEED DATA: POLICY TYPES ───────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM PolicyTypes)
BEGIN
    INSERT INTO PolicyTypes (Name, Description, IsActive) VALUES
    ('Life Insurance', 'Covers the risk of death of the insured', 1),
    ('Health Insurance', 'Covers medical expenses and hospitalization', 1),
    ('Motor Insurance', 'Covers vehicles against damage, theft, and third-party liability', 1),
    ('Home Insurance', 'Protects homes against natural calamities and theft', 1),
    ('Travel Insurance', 'Covers travel-related risks including trip cancellation and medical emergencies', 1),
    ('Business Insurance', 'Covers business risks including liability, property damage, and employee coverage', 1);
END
GO

-- ── STORED PROCEDURES ──────────────────────────────────────────

-- Get Dashboard Summary
CREATE OR ALTER PROCEDURE usp_GetDashboardSummary
AS
BEGIN
    SET NOCOUNT ON;

    -- Summary counts
    SELECT 
        COUNT(*) AS TotalPolicies,
        SUM(CASE WHEN Status = 'Active' THEN 1 ELSE 0 END) AS ActivePolicies,
        SUM(CASE WHEN Status = 'Expired' THEN 1 ELSE 0 END) AS ExpiredPolicies,
        SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) AS PendingPolicies,
        SUM(CASE WHEN Status = 'Cancelled' THEN 1 ELSE 0 END) AS CancelledPolicies,
        ISNULL(SUM(PremiumAmount), 0) AS TotalPremium,
        ISNULL(SUM(CoverageAmount), 0) AS TotalCoverage
    FROM Policies
    WHERE IsDeleted = 0;

    -- Policy type distribution
    SELECT 
        pt.Name AS PolicyTypeName,
        COUNT(p.Id) AS PolicyCount,
        ISNULL(SUM(p.PremiumAmount), 0) AS TotalPremium
    FROM PolicyTypes pt
    LEFT JOIN Policies p ON pt.Id = p.PolicyTypeId AND p.IsDeleted = 0
    WHERE pt.IsActive = 1
    GROUP BY pt.Name
    ORDER BY PolicyCount DESC;

    -- Monthly trend (last 12 months)
    SELECT 
        FORMAT(CreatedAt, 'yyyy-MM') AS Month,
        COUNT(*) AS PolicyCount
    FROM Policies
    WHERE IsDeleted = 0
      AND CreatedAt >= DATEADD(MONTH, -12, GETUTCDATE())
    GROUP BY FORMAT(CreatedAt, 'yyyy-MM')
    ORDER BY Month;
END
GO

-- Search Policies with Pagination
CREATE OR ALTER PROCEDURE usp_SearchPolicies
    @SearchTerm     NVARCHAR(200) = NULL,
    @PolicyTypeId   INT = NULL,
    @Status         NVARCHAR(20) = NULL,
    @StartDateFrom  DATETIME2 = NULL,
    @StartDateTo    DATETIME2 = NULL,
    @SortBy         NVARCHAR(50) = 'CreatedAt',
    @SortDir        NVARCHAR(4) = 'DESC',
    @PageNumber     INT = 1,
    @PageSize       INT = 10
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    -- Total count
    SELECT COUNT(*) AS TotalCount
    FROM Policies p
    WHERE p.IsDeleted = 0
      AND (@SearchTerm IS NULL OR 
           p.PolicyNumber LIKE '%' + @SearchTerm + '%' OR
           p.PolicyHolderName LIKE '%' + @SearchTerm + '%' OR
           p.Email LIKE '%' + @SearchTerm + '%')
      AND (@PolicyTypeId IS NULL OR p.PolicyTypeId = @PolicyTypeId)
      AND (@Status IS NULL OR p.Status = @Status)
      AND (@StartDateFrom IS NULL OR p.StartDate >= @StartDateFrom)
      AND (@StartDateTo IS NULL OR p.StartDate <= @StartDateTo);

    -- Paged results
    SELECT 
        p.*,
        pt.Name AS PolicyTypeName,
        u.FullName AS CreatedByName
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
    ORDER BY
        CASE WHEN @SortBy = 'PolicyNumber' AND @SortDir = 'ASC' THEN p.PolicyNumber END ASC,
        CASE WHEN @SortBy = 'PolicyNumber' AND @SortDir = 'DESC' THEN p.PolicyNumber END DESC,
        CASE WHEN @SortBy = 'PolicyHolderName' AND @SortDir = 'ASC' THEN p.PolicyHolderName END ASC,
        CASE WHEN @SortBy = 'PolicyHolderName' AND @SortDir = 'DESC' THEN p.PolicyHolderName END DESC,
        CASE WHEN @SortBy = 'PremiumAmount' AND @SortDir = 'ASC' THEN p.PremiumAmount END ASC,
        CASE WHEN @SortBy = 'PremiumAmount' AND @SortDir = 'DESC' THEN p.PremiumAmount END DESC,
        CASE WHEN @SortBy = 'CreatedAt' AND @SortDir = 'ASC' THEN p.CreatedAt END ASC,
        CASE WHEN @SortBy = 'CreatedAt' AND @SortDir = 'DESC' THEN p.CreatedAt END DESC,
        p.CreatedAt DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- Get policies expiring soon (within N days)
CREATE OR ALTER PROCEDURE usp_GetExpiringPolicies
    @DaysAhead INT = 30
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        p.*,
        pt.Name AS PolicyTypeName
    FROM Policies p
    INNER JOIN PolicyTypes pt ON p.PolicyTypeId = pt.Id
    WHERE p.IsDeleted = 0
      AND p.Status = 'Active'
      AND p.EndDate BETWEEN GETUTCDATE() AND DATEADD(DAY, @DaysAhead, GETUTCDATE())
    ORDER BY p.EndDate ASC;
END
GO

-- ── POLICY REMINDER EVENTS TABLE ─────────────────────────────
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PolicyReminderEvents' AND xtype='U')
BEGIN
    CREATE TABLE PolicyReminderEvents (
        Id                  INT IDENTITY(1,1) PRIMARY KEY,
        PolicyId            INT             NOT NULL,
        RecipientEmail      NVARCHAR(200)   NOT NULL,
        RecipientName       NVARCHAR(200)   NOT NULL,
        PolicyNumber        NVARCHAR(50)    NOT NULL,
        PolicyDueDate       DATETIME2       NOT NULL,
        DaysBeforeDue       INT             NOT NULL,
        CreatedAt           DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
        SentAt              DATETIME2       NULL,
        Status              NVARCHAR(20)    NOT NULL DEFAULT 'Pending',
        RetryCount          INT             NOT NULL DEFAULT 0,
        ErrorMessage        NVARCHAR(2000)  NULL,
        EmailSubject        NVARCHAR(500)   NULL,

        CONSTRAINT FK_PolicyReminderEvents_Policy FOREIGN KEY (PolicyId) 
            REFERENCES Policies(Id) ON DELETE CASCADE,
        CONSTRAINT CK_PolicyReminderEvents_Status CHECK (Status IN ('Pending','Sent','Failed','Cancelled'))
    );
END
GO

-- ── INDEXES for PolicyReminderEvents ─────────────────────────
CREATE NONCLUSTERED INDEX IX_PolicyReminderEvents_Status ON PolicyReminderEvents(Status);
CREATE NONCLUSTERED INDEX IX_PolicyReminderEvents_PolicyDueDate ON PolicyReminderEvents(PolicyDueDate);
CREATE UNIQUE NONCLUSTERED INDEX IX_PolicyReminderEvents_UniqueReminder 
    ON PolicyReminderEvents(PolicyId, DaysBeforeDue, PolicyDueDate);
GO

-- ── STORED PROCEDURE: Get Pending Reminders ──────────────────
CREATE OR ALTER PROCEDURE usp_GetPendingReminders
    @MaxRetries INT = 3
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        r.*,
        p.PolicyHolderName,
        p.Status AS PolicyStatus,
        pt.Name AS PolicyTypeName
    FROM PolicyReminderEvents r
    INNER JOIN Policies p ON r.PolicyId = p.Id
    INNER JOIN PolicyTypes pt ON p.PolicyTypeId = pt.Id
    WHERE r.Status = 'Pending'
       OR (r.Status = 'Failed' AND r.RetryCount < @MaxRetries)
    ORDER BY r.CreatedAt ASC;
END
GO

-- ── STORED PROCEDURE: Get Reminder Summary ───────────────────
CREATE OR ALTER PROCEDURE usp_GetReminderSummary
    @DaysBack INT = 30
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        Status,
        COUNT(*) AS EventCount,
        MIN(CreatedAt) AS EarliestEvent,
        MAX(CreatedAt) AS LatestEvent
    FROM PolicyReminderEvents
    WHERE CreatedAt >= DATEADD(DAY, -@DaysBack, GETUTCDATE())
    GROUP BY Status
    ORDER BY Status;
END
GO

PRINT '✅ PolicyManagerDB setup completed successfully!';
GO

