using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PolicyManager.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FamilyMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: false),
                    Relationship = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ParentId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FamilyMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FamilyMembers_FamilyMembers_ParentId",
                        column: x => x.ParentId,
                        principalTable: "FamilyMembers",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PolicyTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PolicyTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FullName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PolicyReminderSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PolicyTypeId = table.Column<int>(type: "integer", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    DaysBeforeDue = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PolicyReminderSettings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PolicyReminderSettings_PolicyTypes_PolicyTypeId",
                        column: x => x.PolicyTypeId,
                        principalTable: "PolicyTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityId = table.Column<int>(type: "integer", nullable: true),
                    OldValues = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    NewValues = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    IpAddress = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "MutualFunds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FolioNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FundHouse = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    SchemeName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Option = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    InvestmentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    InvestedAmount = table.Column<decimal>(type: "numeric(18,4)", nullable: false),
                    CurrentNav = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    TotalUnits = table.Column<decimal>(type: "numeric(18,4)", nullable: true),
                    CurrentValuation = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RedemptionDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NextSipDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    NomineeName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    NomineeRelationship = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    BankAccountDetails = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    SpecialRemarks = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FamilyMemberId = table.Column<int>(type: "integer", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MutualFunds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MutualFunds_FamilyMembers_FamilyMemberId",
                        column: x => x.FamilyMemberId,
                        principalTable: "FamilyMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MutualFunds_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Policies",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PolicyNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PolicyHolderName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    TotalPaidAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    PolicyTypeId = table.Column<int>(type: "integer", nullable: false),
                    PremiumAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    CoverageAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EndDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SchemeName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    CompanyName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ProductName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    LocationUnit = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Duration = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CoverageDescription = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TaxAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    GstApplicable = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    InstallmentAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    NetPremium = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    BankAccountDetails = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AgentName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AlternateContactNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SpecialRemarks = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    MaturityDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TotalMaturityAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AdditionalDetails = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    NomineeName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    NomineeRelation = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    InstallmentType = table.Column<string>(type: "text", nullable: true),
                    NextInstallmentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AnnuityDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AnnuityAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    AutoDebit = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TermYears = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    PayingTerm = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FamilyMemberId = table.Column<int>(type: "integer", nullable: true),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Policies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Policies_FamilyMembers_FamilyMemberId",
                        column: x => x.FamilyMemberId,
                        principalTable: "FamilyMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Policies_PolicyTypes_PolicyTypeId",
                        column: x => x.PolicyTypeId,
                        principalTable: "PolicyTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Policies_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "InAppNotifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PolicyId = table.Column<int>(type: "integer", nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    IsDismissed = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InAppNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InAppNotifications_Policies_PolicyId",
                        column: x => x.PolicyId,
                        principalTable: "Policies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InAppNotifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PolicyId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PaymentMethod = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    TransactionId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ProcessedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_Policies_PolicyId",
                        column: x => x.PolicyId,
                        principalTable: "Policies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Payments_Users_ProcessedByUserId",
                        column: x => x.ProcessedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PolicyDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PolicyId = table.Column<int>(type: "integer", nullable: false),
                    DocumentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    FileName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    FilePath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    FileExtension = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UploadedByUserId = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PolicyDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PolicyDocuments_Policies_PolicyId",
                        column: x => x.PolicyId,
                        principalTable: "Policies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PolicyDocuments_Users_UploadedByUserId",
                        column: x => x.UploadedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PolicyReminderEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PolicyId = table.Column<int>(type: "integer", nullable: false),
                    RecipientEmail = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    RecipientName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PolicyNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PolicyDueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DaysBeforeDue = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SentAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RetryCount = table.Column<int>(type: "integer", nullable: false),
                    ErrorMessage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CustomNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    EmailSubject = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PolicyReminderEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PolicyReminderEvents_Policies_PolicyId",
                        column: x => x.PolicyId,
                        principalTable: "Policies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "PolicyTypes",
                columns: new[] { "Id", "Description", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "Covers the risk of death of the insured", true, "Life Insurance" },
                    { 2, "Covers medical expenses and hospitalization", true, "Health Insurance" },
                    { 3, "Covers vehicles against damage, theft, and third-party liability", true, "Motor Insurance" },
                    { 4, "Protects homes against natural calamities and theft", true, "Home Insurance" },
                    { 5, "Covers travel-related risks including trip cancellation and medical emergencies", true, "Travel Insurance" },
                    { 6, "Covers business risks including liability, property damage, and employee coverage", true, "Business Insurance" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_EntityName",
                table: "AuditLogs",
                column: "EntityName");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Timestamp",
                table: "AuditLogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_UserId",
                table: "AuditLogs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FamilyMembers_ParentId",
                table: "FamilyMembers",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_InAppNotifications_CreatedAt",
                table: "InAppNotifications",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_InAppNotifications_IsRead",
                table: "InAppNotifications",
                column: "IsRead");

            migrationBuilder.CreateIndex(
                name: "IX_InAppNotifications_PolicyId",
                table: "InAppNotifications",
                column: "PolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_UserUnread",
                table: "InAppNotifications",
                columns: new[] { "UserId", "IsRead", "IsDismissed" });

            migrationBuilder.CreateIndex(
                name: "IX_MutualFunds_CreatedByUserId",
                table: "MutualFunds",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MutualFunds_FamilyMemberId",
                table: "MutualFunds",
                column: "FamilyMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PaymentDate",
                table: "Payments",
                column: "PaymentDate");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_PolicyId",
                table: "Payments",
                column: "PolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ProcessedByUserId",
                table: "Payments",
                column: "ProcessedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Policies_CreatedByUserId",
                table: "Policies",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Policies_Email",
                table: "Policies",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_Policies_FamilyMemberId",
                table: "Policies",
                column: "FamilyMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_Policies_IsDeleted",
                table: "Policies",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_Policies_PolicyNumber",
                table: "Policies",
                column: "PolicyNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Policies_PolicyTypeId",
                table: "Policies",
                column: "PolicyTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Policies_Status",
                table: "Policies",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_PolicyDocuments_PolicyId",
                table: "PolicyDocuments",
                column: "PolicyId");

            migrationBuilder.CreateIndex(
                name: "IX_PolicyDocuments_UploadedByUserId",
                table: "PolicyDocuments",
                column: "UploadedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PolicyReminderEvents_PolicyDueDate",
                table: "PolicyReminderEvents",
                column: "PolicyDueDate");

            migrationBuilder.CreateIndex(
                name: "IX_PolicyReminderEvents_Status",
                table: "PolicyReminderEvents",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_PolicyReminderEvents_UniqueReminder",
                table: "PolicyReminderEvents",
                columns: new[] { "PolicyId", "DaysBeforeDue", "PolicyDueDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PolicyReminderSettings_PolicyTypeId",
                table: "PolicyReminderSettings",
                column: "PolicyTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "InAppNotifications");

            migrationBuilder.DropTable(
                name: "MutualFunds");

            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropTable(
                name: "PolicyDocuments");

            migrationBuilder.DropTable(
                name: "PolicyReminderEvents");

            migrationBuilder.DropTable(
                name: "PolicyReminderSettings");

            migrationBuilder.DropTable(
                name: "Policies");

            migrationBuilder.DropTable(
                name: "FamilyMembers");

            migrationBuilder.DropTable(
                name: "PolicyTypes");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
