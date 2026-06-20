using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PolicyManager.API.Data;
using PolicyManager.API.DTOs;
using PolicyManager.API.Helpers;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services
{
    public interface IFamilyMemberService
    {
        Task<List<FamilyMemberDto>> GetAllAsync();
        Task<string[]> GetAllNamesAsync();
        Task<FamilyMemberDto?> GetByIdAsync(int id);
        Task<List<PolicyDto>> GetPoliciesByMemberAsync(int memberId);
        Task<FamilyMemberDto> CreateAsync(CreateFamilyMemberDto dto);
        Task<FamilyMemberDto> UpdateAsync(int id, CreateFamilyMemberDto dto);
        Task<bool> DeleteAsync(int id);
    }

    public class FamilyMemberService : IFamilyMemberService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public FamilyMemberService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<FamilyMemberDto>> GetAllAsync()
        {
            var members = await _context.FamilyMembers
                .Include(m => m.Parent)
                .Include(m => m.Children)
                .Include(m => m.Policies)
                    .ThenInclude(p => p.PolicyType)
                .AsNoTracking()
                .OrderBy(m => m.Name)
                .ToListAsync();

            return members.Select(m => new FamilyMemberDto
            {
                Id = m.Id,
                Name = m.Name,
                DateOfBirth = m.DateOfBirth,
                Relationship = m.Relationship,
                ParentId = m.ParentId,
                ParentName = m.Parent?.Name,
                Children = m.Children.Select(c => new FamilyMemberDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    DateOfBirth = c.DateOfBirth,
                    Relationship = c.Relationship,
                    ParentId = c.ParentId
                }).ToList(),
                PolicyCount = m.Policies.Count(p => !p.IsDeleted),
                ActivePolicyCount = m.Policies.Count(p => !p.IsDeleted && p.Status == PolicyConstants.StatusActive),
                TotalPremium = m.Policies.Where(p => !p.IsDeleted).Sum(p => p.PremiumAmount),
                TotalCoverage = m.Policies.Where(p => !p.IsDeleted).Sum(p => p.CoverageAmount ?? 0),
                Policies = m.Policies.Where(p => !p.IsDeleted).Select(p => new FamilyMemberPolicySummaryDto
                {
                    Id = p.Id,
                    PolicyNumber = p.PolicyNumber,
                    PolicyTypeName = p.PolicyType?.Name ?? "",
                    PremiumAmount = p.PremiumAmount,
                    CoverageAmount = p.CoverageAmount,
                    Status = p.Status,
                    NextInstallmentDate = p.NextInstallmentDate,
                    InstallmentType = p.InstallmentType,
                    StartDate = p.StartDate,
                    EndDate = p.EndDate,
                    CompanyName = p.CompanyName
                }).OrderByDescending(p => p.StartDate).ToList()
            }).ToList();
        }

        public async Task<string[]> GetAllNamesAsync()
        {
            return await _context.FamilyMembers.Select(m => m.Name).ToArrayAsync();
        }

        public async Task<FamilyMemberDto?> GetByIdAsync(int id)
        {
            var member = await _context.FamilyMembers
                .Include(m => m.Parent)
                .Include(m => m.Children)
                .Include(m => m.Policies)
                    .ThenInclude(p => p.PolicyType)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (member == null) return null;

            var dto = _mapper.Map<FamilyMemberDto>(member);
            
            // Map Children (shallow to avoid recursion)
            dto.Children = member.Children.Select(c => new FamilyMemberDto
            {
                Id = c.Id,
                Name = c.Name,
                DateOfBirth = c.DateOfBirth,
                Relationship = c.Relationship,
                ParentId = c.ParentId
            }).ToList();

            // Enrich with policy data
            dto.PolicyCount = member.Policies.Count(p => !p.IsDeleted);
            dto.ActivePolicyCount = member.Policies.Count(p => !p.IsDeleted && p.Status == PolicyConstants.StatusActive);
            dto.TotalPremium = member.Policies.Where(p => !p.IsDeleted).Sum(p => p.PremiumAmount);
            dto.TotalCoverage = member.Policies.Where(p => !p.IsDeleted).Sum(p => p.CoverageAmount ?? 0);
            dto.Policies = member.Policies.Where(p => !p.IsDeleted).Select(p => new FamilyMemberPolicySummaryDto
            {
                Id = p.Id,
                PolicyNumber = p.PolicyNumber,
                PolicyTypeName = p.PolicyType?.Name ?? "",
                PremiumAmount = p.PremiumAmount,
                CoverageAmount = p.CoverageAmount,
                Status = p.Status,
                NextInstallmentDate = p.NextInstallmentDate,
                InstallmentType = p.InstallmentType,
                StartDate = p.StartDate,
                EndDate = p.EndDate,
                CompanyName = p.CompanyName
            }).OrderByDescending(p => p.StartDate).ToList();

            return dto;
        }

        public async Task<List<PolicyDto>> GetPoliciesByMemberAsync(int memberId)
        {
            var policies = await _context.Policies
                .Include(p => p.PolicyType)
                .Include(p => p.FamilyMember)
                .Include(p => p.Payments)
                .Include(p => p.Documents)
                .Where(p => p.FamilyMemberId == memberId && !p.IsDeleted)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
            return _mapper.Map<List<PolicyDto>>(policies);
        }

        public async Task<FamilyMemberDto> CreateAsync(CreateFamilyMemberDto dto)
        {
            var member = _mapper.Map<FamilyMember>(dto);
            _context.FamilyMembers.Add(member);
            await _context.SaveChangesAsync();
            
            return await GetByIdAsync(member.Id) ?? throw new Exception("Failed to reload created member.");
        }

        public async Task<FamilyMemberDto> UpdateAsync(int id, CreateFamilyMemberDto dto)
        {
            var member = await _context.FamilyMembers.FirstOrDefaultAsync(m => m.Id == id)
                ?? throw new KeyNotFoundException("Family member not found.");
            
            _mapper.Map(dto, member);
            await _context.SaveChangesAsync();
            
            return await GetByIdAsync(member.Id) ?? throw new Exception("Failed to reload updated member.");
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var member = await _context.FamilyMembers.Include(m => m.Policies).FirstOrDefaultAsync(m => m.Id == id)
                ?? throw new KeyNotFoundException("Family member not found.");
            
            if (member.Policies.Any(p => !p.IsDeleted))
                throw new InvalidOperationException("Cannot delete member with linked policies.");

            _context.FamilyMembers.Remove(member);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
