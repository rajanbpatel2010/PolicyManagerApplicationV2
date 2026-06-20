using Microsoft.EntityFrameworkCore;
using PolicyManager.API.Models;

namespace PolicyManager.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Policy> Policies => Set<Policy>();
    public DbSet<PolicyType> PolicyTypes => Set<PolicyType>();
    public DbSet<User> Users => Set<User>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<PolicyReminderEvent> PolicyReminderEvents => Set<PolicyReminderEvent>();
    public DbSet<PolicyReminderSetting> PolicyReminderSettings => Set<PolicyReminderSetting>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<PolicyDocument> PolicyDocuments => Set<PolicyDocument>();
    public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
    public DbSet<InAppNotification> InAppNotifications => Set<InAppNotification>();
    public DbSet<MutualFund> MutualFunds => Set<MutualFund>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Policy ──────────────────────────────────────────
        modelBuilder.Entity<Policy>(entity =>
        {
            entity.HasIndex(p => p.PolicyNumber).IsUnique();
            entity.HasIndex(p => p.Status);
            entity.HasIndex(p => p.Email);
            entity.HasIndex(p => p.IsDeleted);

            entity.HasQueryFilter(p => !p.IsDeleted); // Global soft-delete filter

            entity.HasOne(p => p.PolicyType)
                  .WithMany(pt => pt.Policies)
                  .HasForeignKey(p => p.PolicyTypeId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(p => p.CreatedBy)
                  .WithMany(u => u.Policies)
                  .HasForeignKey(p => p.CreatedByUserId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(p => p.Payments)
                  .WithOne(pay => pay.Policy)
                  .HasForeignKey(pay => pay.PolicyId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(p => p.Documents)
                  .WithOne(d => d.Policy)
                  .HasForeignKey(d => d.PolicyId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(p => p.FamilyMember)
                  .WithMany(fm => fm.Policies)
                  .HasForeignKey(p => p.FamilyMemberId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── PolicyDocument ──────────────────────────────────
        modelBuilder.Entity<PolicyDocument>(entity =>
        {
            entity.HasIndex(d => d.PolicyId);
        });

        // ── Payment ──────────────────────────────────────────
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasIndex(pay => pay.PaymentDate);
            entity.HasIndex(pay => pay.PolicyId);

            entity.HasOne(pay => pay.ProcessedBy)
                  .WithMany()
                  .HasForeignKey(pay => pay.ProcessedByUserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── User ────────────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
        });

        // ── AuditLog ────────────────────────────────────────
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasIndex(a => a.Timestamp);
            entity.HasIndex(a => a.EntityName);

            entity.HasOne(a => a.User)
                  .WithMany(u => u.AuditLogs)
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── PolicyReminderEvent ──────────────────────────────
        modelBuilder.Entity<PolicyReminderEvent>(entity =>
        {
            entity.HasIndex(r => r.Status);
            entity.HasIndex(r => r.PolicyDueDate);
            entity.HasIndex(r => new { r.PolicyId, r.DaysBeforeDue, r.PolicyDueDate })
                  .IsUnique()
                  .HasDatabaseName("IX_PolicyReminderEvents_UniqueReminder");

            entity.HasOne(r => r.Policy)
                  .WithMany()
                  .HasForeignKey(r => r.PolicyId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── InAppNotification ────────────────────────────────
        modelBuilder.Entity<InAppNotification>(entity =>
        {
            entity.HasIndex(n => n.IsRead);
            entity.HasIndex(n => n.CreatedAt);
            entity.HasIndex(n => new { n.UserId, n.IsRead, n.IsDismissed })
                  .HasDatabaseName("IX_Notifications_UserUnread");

            entity.HasOne(n => n.Policy)
                  .WithMany()
                  .HasForeignKey(n => n.PolicyId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(n => n.User)
                  .WithMany()
                  .HasForeignKey(n => n.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // ── Seed PolicyTypes ────────────────────────────────
        modelBuilder.Entity<PolicyType>().HasData(
            new PolicyType { Id = 1, Name = "Life Insurance", Description = "Covers the risk of death of the insured", IsActive = true },
            new PolicyType { Id = 2, Name = "Health Insurance", Description = "Covers medical expenses and hospitalization", IsActive = true },
            new PolicyType { Id = 3, Name = "Motor Insurance", Description = "Covers vehicles against damage, theft, and third-party liability", IsActive = true },
            new PolicyType { Id = 4, Name = "Home Insurance", Description = "Protects homes against natural calamities and theft", IsActive = true },
            new PolicyType { Id = 5, Name = "Travel Insurance", Description = "Covers travel-related risks including trip cancellation and medical emergencies", IsActive = true },
            new PolicyType { Id = 6, Name = "Business Insurance", Description = "Covers business risks including liability, property damage, and employee coverage", IsActive = true }
        );
    }

    /// <summary>
    /// Seeds a default admin user and sample policies if the database is empty.
    /// </summary>
    public static async Task SeedDataAsync(AppDbContext context)
    {
        if (!await context.Users.AnyAsync())
        {
            var adminUser = new User
            {
                FullName = "System Admin",
                Email = "rajanbpatel2017@gmail.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var normalUser = new User
            {
                FullName = "Raju",
                Email = "rajanbpatel2006@yahoo.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("User@123"),
                Role = "User",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            context.Users.AddRange(adminUser, normalUser);
            await context.SaveChangesAsync();

            // Seed Family Members
            var self = new FamilyMember { Name = "Rajan Patel", Relationship = "Self", DateOfBirth = new DateOnly(1985, 5, 20) };
            var spouse = new FamilyMember { Name = "Jalpa Patel", Relationship = "Spouse", DateOfBirth = new DateOnly(1988, 8, 15) };
            var child = new FamilyMember { Name = "Aarav Patel", Relationship = "Child", DateOfBirth = new DateOnly(2015, 12, 10) };
            
            context.FamilyMembers.AddRange(self, spouse, child);
            await context.SaveChangesAsync();

            // Seed sample policies
            var policies = new List<Policy>
            {
                new()
                {
                    PolicyNumber = "POL-2024-001",
                    PolicyHolderName = "Jalpa Patel",
                    Email = "jalpa.padshala158@gmail.com",
                    PhoneNumber = "9998858658",
                    PolicyTypeId = 2, // Health
                    PremiumAmount = 8000m,
                    InstallmentAmount = 8000m,
                    CoverageAmount = 500000m,
                    StartDate = new DateTime(2024, 3, 15),
                    EndDate = new DateTime(2025, 3, 14),
                    NextInstallmentDate = DateTime.UtcNow.AddMonths(1), // Due next month
                    Status = "Active",
                    FamilyMemberId = spouse.Id,
                    CreatedByUserId = adminUser.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-20)
                },
                new()
                {
                    PolicyNumber = "POL-2024-002",
                    PolicyHolderName = "Rajan Patel",
                    Email = "rajanbpatel2017@gmail.com",
                    PolicyTypeId = 1, // Life
                    PremiumAmount = 25000m,
                    InstallmentAmount = 25000m,
                    CoverageAmount = 10000000m,
                    StartDate = new DateTime(2024, 1, 10),
                    EndDate = new DateTime(2034, 1, 9),
                    NextInstallmentDate = DateTime.UtcNow.AddMonths(2),
                    Status = "Active",
                    FamilyMemberId = self.Id,
                    CreatedByUserId = adminUser.Id,
                    CreatedAt = DateTime.UtcNow.AddDays(-30)
                }
            };

            context.Policies.AddRange(policies);
            await context.SaveChangesAsync();

            // Seed reminder settings for all types
            var types = await context.PolicyTypes.ToListAsync();
            var settings = types.Select(t => new PolicyReminderSetting
            {
                PolicyTypeId = t.Id,
                IsEnabled = true,
                DaysBeforeDue = 30,
                CreatedAt = DateTime.UtcNow
            });
            context.PolicyReminderSettings.AddRange(settings);
            await context.SaveChangesAsync();
        }

        if (!await context.FamilyMembers.AnyAsync())
        {
            // Seed Family Members
            var self = new FamilyMember { Name = "Rajan Patel", Relationship = "Self", DateOfBirth = new DateOnly(1985, 5, 20) };
            var spouse = new FamilyMember { Name = "Jalpa Patel", Relationship = "Spouse", DateOfBirth = new DateOnly(1988, 8, 15) };
            var child = new FamilyMember { Name = "Aarav Patel", Relationship = "Child", DateOfBirth = new DateOnly(2015, 12, 10) };
            
            context.FamilyMembers.AddRange(self, spouse, child);
            await context.SaveChangesAsync();

            // Link existing policies to family members if possible
            var policies = await context.Policies.ToListAsync();
            foreach(var policy in policies)
            {
                if (policy.PolicyHolderName.Contains("Jalpa")) policy.FamilyMemberId = spouse.Id;
                else if (policy.PolicyHolderName.Contains("Rajan")) policy.FamilyMemberId = self.Id;
            }
            await context.SaveChangesAsync();
        }
    }
}
