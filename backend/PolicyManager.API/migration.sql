BEGIN TRANSACTION;
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('Users'))
    DROP INDEX [IX_Users_Email] ON [Users];
DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Users]') AND [c].[name] = N'Email');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Users] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [Users] ALTER COLUMN [Email] nvarchar(1000) NOT NULL;
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('Users'))
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
GO

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[PolicyReminderEvents]') AND [c].[name] = N'RecipientEmail');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [PolicyReminderEvents] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [PolicyReminderEvents] ALTER COLUMN [RecipientEmail] nvarchar(1000) NOT NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'CustomNote' AND object_id = OBJECT_ID('PolicyReminderEvents'))
    ALTER TABLE [PolicyReminderEvents] ADD [CustomNote] nvarchar(1000) NULL;
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Policies_Status' AND object_id = OBJECT_ID('Policies'))
    DROP INDEX [IX_Policies_Status] ON [Policies];
DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Policies]') AND [c].[name] = N'Status');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [Policies] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [Policies] ALTER COLUMN [Status] nvarchar(50) NOT NULL;
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Policies_Status' AND object_id = OBJECT_ID('Policies'))
    CREATE INDEX [IX_Policies_Status] ON [Policies] ([Status]);
GO

IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Policies_Email' AND object_id = OBJECT_ID('Policies'))
    DROP INDEX [IX_Policies_Email] ON [Policies];
DECLARE @var3 sysname;
SELECT @var3 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Policies]') AND [c].[name] = N'Email');
IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [Policies] DROP CONSTRAINT [' + @var3 + '];');
ALTER TABLE [Policies] ALTER COLUMN [Email] nvarchar(1000) NOT NULL;
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Policies_Email' AND object_id = OBJECT_ID('Policies'))
    CREATE INDEX [IX_Policies_Email] ON [Policies] ([Email]);
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'FamilyMemberId' AND object_id = OBJECT_ID('Policies'))
    ALTER TABLE [Policies] ADD [FamilyMemberId] int NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE name = 'TotalPaidAmount' AND object_id = OBJECT_ID('Policies'))
    ALTER TABLE [Policies] ADD [TotalPaidAmount] decimal(18,2) NULL;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[FamilyMembers]') AND type in (N'U'))
BEGIN
    CREATE TABLE [FamilyMembers] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [DateOfBirth] datetime2 NOT NULL,
        [Relationship] nvarchar(50) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_FamilyMembers] PRIMARY KEY ([Id])
    );
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Policies_FamilyMemberId' AND object_id = OBJECT_ID('Policies'))
    CREATE INDEX [IX_Policies_FamilyMemberId] ON [Policies] ([FamilyMemberId]);
GO

IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Policies_FamilyMembers_FamilyMemberId' AND parent_object_id = OBJECT_ID('Policies'))
    ALTER TABLE [Policies] ADD CONSTRAINT [FK_Policies_FamilyMembers_FamilyMemberId] FOREIGN KEY ([FamilyMemberId]) REFERENCES [FamilyMembers] ([Id]) ON DELETE SET NULL;
GO

IF NOT EXISTS (SELECT * FROM [__EFMigrationsHistory] WHERE [MigrationId] = N'20260423195739_AddFamilyMemberEntity')
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260423195739_AddFamilyMemberEntity', N'8.0.0');
GO

COMMIT;
GO

