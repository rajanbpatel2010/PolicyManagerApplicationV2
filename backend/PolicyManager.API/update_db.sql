IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Payments]') AND type in (N'U'))
BEGIN
CREATE TABLE [Payments] (
    [Id] int NOT NULL IDENTITY,
    [PolicyId] int NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [PaymentDate] datetime2 NOT NULL,
    [PaymentMethod] nvarchar(50) NOT NULL,
    [TransactionId] nvarchar(100) NULL,
    [Notes] nvarchar(500) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ProcessedByUserId] int NULL,
    CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Payments_Policies_PolicyId] FOREIGN KEY ([PolicyId]) REFERENCES [Policies] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Payments_Users_ProcessedByUserId] FOREIGN KEY ([ProcessedByUserId]) REFERENCES [Users] ([Id]) ON DELETE SET NULL
);
END
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PolicyDocuments]') AND type in (N'U'))
BEGIN
CREATE TABLE [PolicyDocuments] (
    [Id] int NOT NULL IDENTITY,
    [PolicyId] int NOT NULL,
    [FileName] nvarchar(200) NOT NULL,
    [FilePath] nvarchar(500) NOT NULL,
    [FileExtension] nvarchar(10) NOT NULL,
    [FileSize] bigint NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UploadedByUserId] int NULL,
    CONSTRAINT [PK_PolicyDocuments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PolicyDocuments_Policies_PolicyId] FOREIGN KEY ([PolicyId]) REFERENCES [Policies] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_PolicyDocuments_Users_UploadedByUserId] FOREIGN KEY ([UploadedByUserId]) REFERENCES [Users] ([Id])
);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Payments]') AND name = N'IX_Payments_PaymentDate')
CREATE INDEX [IX_Payments_PaymentDate] ON [Payments] ([PaymentDate]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Payments]') AND name = N'IX_Payments_PolicyId')
CREATE INDEX [IX_Payments_PolicyId] ON [Payments] ([PolicyId]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[Payments]') AND name = N'IX_Payments_ProcessedByUserId')
CREATE INDEX [IX_Payments_ProcessedByUserId] ON [Payments] ([ProcessedByUserId]);
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[PolicyDocuments]') AND name = N'IX_PolicyDocuments_PolicyId')
CREATE INDEX [IX_PolicyDocuments_PolicyId] ON [PolicyDocuments] ([PolicyId]);
GO
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE object_id = OBJECT_ID(N'[dbo].[PolicyDocuments]') AND name = N'IX_PolicyDocuments_UploadedByUserId')
CREATE INDEX [IX_PolicyDocuments_UploadedByUserId] ON [PolicyDocuments] ([UploadedByUserId]);
GO
