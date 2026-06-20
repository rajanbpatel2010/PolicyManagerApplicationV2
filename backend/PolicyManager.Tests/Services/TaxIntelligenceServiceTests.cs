using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using PolicyManager.API.Data;
using PolicyManager.API.Models;
using PolicyManager.API.Services;
using Xunit;

namespace PolicyManager.Tests.Services;

public class TaxIntelligenceServiceTests
{
    private readonly AppDbContext _context;
    private readonly TaxIntelligenceService _service;
    private readonly Microsoft.Data.Sqlite.SqliteConnection _connection;

    public TaxIntelligenceServiceTests()
    {
        _connection = new Microsoft.Data.Sqlite.SqliteConnection("Filename=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;
            
        _context = new AppDbContext(options);
        _context.Database.EnsureCreated();
        _service = new TaxIntelligenceService(_context);
    }

    [Fact]
    public async Task GetTaxPlanningAsync_Should_Calculate80C_Correctly()
    {
        // Arrange
        int userId = 1;
        _context.Users.Add(new User { Id = userId, FullName = "Test User", Email = "test@test.com", PasswordHash = "...", Role = "User" });
        
        _context.Policies.Add(new Policy {
            PolicyNumber = "POL-001",
            PolicyTypeId = 1, // Life Insurance (Seeded)
            PremiumAmount = 50000,
            Status = "Active",
            CreatedByUserId = userId
        });
        
        _context.Policies.Add(new Policy {
            PolicyNumber = "POL-002",
            PolicyTypeId = 1, // Life Insurance (Seeded)
            PremiumAmount = 120000,
            Status = "Active",
            CreatedByUserId = userId
        });
        
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetTaxPlanningAsync(userId);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.Total80CDeduction.Should().Be(170000); // 50k + 120k
        result.Data.Remaining80CLimit.Should().Be(0); // Capped at 1.5L, but we show total in this field before capping in logic? 
        // Logic says: result.Remaining80CLimit = Math.Max(0, Max80CLimit - result.Total80CDeduction);
        // So 150k - 170k = -20k -> Max(0, -20k) = 0. Correct.
    }

    [Fact]
    public async Task GetTaxPlanningAsync_Should_Calculate80D_WithSeniorCitizen_Limit()
    {
        // Arrange
        int userId = 2;
        _context.Users.Add(new User { Id = userId, FullName = "Test User 2", Email = "test2@test.com", PasswordHash = "...", Role = "User" });
        
        var seniorMember = new FamilyMember { 
            Id = 1, 
            Name = "Dad", 
            Relationship = "Parent", 
            DateOfBirth = new DateOnly(1950, 1, 1) 
        };
        _context.FamilyMembers.Add(seniorMember);
        
        _context.Policies.Add(new Policy {
            PolicyNumber = "POL-H1",
            PolicyTypeId = 2, // Health Insurance (Seeded)
            PremiumAmount = 30000,
            Status = "Active",
            CreatedByUserId = userId,
            FamilyMemberId = 1
        });
        
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetTaxPlanningAsync(userId);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.Total80DDeduction.Should().Be(30000);
        // Senior Citizen limit is 50k. Parent limit is usually 25k (Standard) or 50k (Senior).
        // Total limit = Self(25k) + ParentSenior(50k) = 75k? 
        // My logic in service: decimal total80DLimit = limitSelfFamily + limitParents;
        // limitSelfFamily (Standard = 25k) + limitParents (Senior = 50k) = 75k.
        // Remaining = 75k - 30k = 45k.
        result.Data.Remaining80DLimit.Should().Be(45000);
    }
}
