using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PolicyManager.API.Data;
using PolicyManager.API.DTOs;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services;

public class MutualFundService : IMutualFundService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IAuditLogService _auditLogService;
    private readonly ILogger<MutualFundService> _logger;

    public MutualFundService(
        AppDbContext context,
        IMapper mapper,
        IAuditLogService auditLogService,
        ILogger<MutualFundService> logger)
    {
        _context = context;
        _mapper = mapper;
        _auditLogService = auditLogService;
        _logger = logger;
    }

    public async Task<PagedResult<MutualFundDto>> GetMutualFundsAsync(MutualFundFilterDto filter)
    {
        var query = _context.Set<MutualFund>()
            .Include(m => m.FamilyMember)
            .Include(m => m.CreatedByUser)
            .AsQueryable();

        // Apply filters
        if (filter.FamilyMemberId.HasValue)
        {
            query = query.Where(m => m.FamilyMemberId == filter.FamilyMemberId.Value);
        }

        if (!string.IsNullOrEmpty(filter.FundHouse))
        {
            query = query.Where(m => m.FundHouse == filter.FundHouse);
        }

        if (!string.IsNullOrEmpty(filter.Category))
        {
            query = query.Where(m => m.Category == filter.Category);
        }

        if (!string.IsNullOrEmpty(filter.InvestmentType))
        {
            query = query.Where(m => m.InvestmentType == filter.InvestmentType);
        }

        if (!string.IsNullOrEmpty(filter.Status))
        {
            query = query.Where(m => m.Status == filter.Status);
        }

        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            var search = filter.SearchTerm.ToLower().Trim();
            query = query.Where(m => 
                m.SchemeName.ToLower().Contains(search) || 
                m.FolioNumber.ToLower().Contains(search) || 
                m.FundHouse.ToLower().Contains(search));
        }

        // Total Count
        int totalCount = await query.CountAsync();

        // Apply sorting
        query = filter.SortBy.ToLower() switch
        {
            "folionumber" => filter.SortDirection.ToLower() == "asc" ? query.OrderBy(m => m.FolioNumber) : query.OrderByDescending(m => m.FolioNumber),
            "fundhouse" => filter.SortDirection.ToLower() == "asc" ? query.OrderBy(m => m.FundHouse) : query.OrderByDescending(m => m.FundHouse),
            "schemename" => filter.SortDirection.ToLower() == "asc" ? query.OrderBy(m => m.SchemeName) : query.OrderByDescending(m => m.SchemeName),
            "investedamount" => filter.SortDirection.ToLower() == "asc" ? query.OrderBy(m => m.InvestedAmount) : query.OrderByDescending(m => m.InvestedAmount),
            "currentvaluation" => filter.SortDirection.ToLower() == "asc" ? query.OrderBy(m => m.CurrentValuation) : query.OrderByDescending(m => m.CurrentValuation),
            "startdate" => filter.SortDirection.ToLower() == "asc" ? query.OrderBy(m => m.StartDate) : query.OrderByDescending(m => m.StartDate),
            _ => filter.SortDirection.ToLower() == "asc" ? query.OrderBy(m => m.CreatedAt) : query.OrderByDescending(m => m.CreatedAt)
        };

        // Apply Paging
        int pageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
        int pageSize = filter.PageSize < 1 ? 10 : filter.PageSize;

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtoItems = _mapper.Map<List<MutualFundDto>>(items);

        return new PagedResult<MutualFundDto>
        {
            Items = dtoItems,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize
        };
    }

    public async Task<MutualFundDto?> GetMutualFundByIdAsync(int id)
    {
        var fund = await _context.Set<MutualFund>()
            .Include(m => m.FamilyMember)
            .Include(m => m.CreatedByUser)
            .FirstOrDefaultAsync(m => m.Id == id);

        return fund == null ? null : _mapper.Map<MutualFundDto>(fund);
    }

    public async Task<MutualFundDto> CreateMutualFundAsync(CreateMutualFundDto dto, int? userId)
    {
        var fund = _mapper.Map<MutualFund>(dto);
        fund.CreatedByUserId = userId;
        fund.CreatedAt = DateTime.UtcNow;

        // Auto-calculate valuation if Nav and Units are supplied
        if (fund.TotalUnits.HasValue && fund.CurrentNav.HasValue)
        {
            fund.CurrentValuation = fund.TotalUnits.Value * fund.CurrentNav.Value;
        }

        _context.Set<MutualFund>().Add(fund);
        await _context.SaveChangesAsync();

        // Fetch fully populated entity for mapping
        var fullyLoaded = await _context.Set<MutualFund>()
            .Include(m => m.FamilyMember)
            .Include(m => m.CreatedByUser)
            .FirstAsync(m => m.Id == fund.Id);

        // Audit Logging
        await _auditLogService.LogAsync(
            action: "Create",
            entityName: "MutualFund",
            entityId: fund.Id,
            oldValues: null,
            newValues: $"Folio: {fund.FolioNumber}, Scheme: {fund.SchemeName}, Invested: {fund.InvestedAmount}",
            userId: userId
        );

        return _mapper.Map<MutualFundDto>(fullyLoaded);
    }

    public async Task<MutualFundDto?> UpdateMutualFundAsync(int id, UpdateMutualFundDto dto, int? userId)
    {
        var fund = await _context.Set<MutualFund>().FindAsync(id);
        if (fund == null) return null;

        // Track original values for detailed audit log
        var oldValues = $"Folio: {fund.FolioNumber}, Scheme: {fund.SchemeName}, Invested: {fund.InvestedAmount}, Val: {fund.CurrentValuation}, Units: {fund.TotalUnits}, NAV: {fund.CurrentNav}";

        // Map updates
        _mapper.Map(dto, fund);
        fund.UpdatedAt = DateTime.UtcNow;

        // Auto-calculate valuation if Nav and Units are supplied
        if (fund.TotalUnits.HasValue && fund.CurrentNav.HasValue)
        {
            fund.CurrentValuation = fund.TotalUnits.Value * fund.CurrentNav.Value;
        }

        await _context.SaveChangesAsync();

        var fullyLoaded = await _context.Set<MutualFund>()
            .Include(m => m.FamilyMember)
            .Include(m => m.CreatedByUser)
            .FirstAsync(m => m.Id == fund.Id);

        var newValues = $"Folio: {fund.FolioNumber}, Scheme: {fund.SchemeName}, Invested: {fund.InvestedAmount}, Val: {fund.CurrentValuation}, Units: {fund.TotalUnits}, NAV: {fund.CurrentNav}";

        // Audit Logging
        await _auditLogService.LogAsync(
            action: "Update",
            entityName: "MutualFund",
            entityId: fund.Id,
            oldValues: oldValues,
            newValues: newValues,
            userId: userId
        );

        return _mapper.Map<MutualFundDto>(fullyLoaded);
    }

    public async Task<bool> DeleteMutualFundAsync(int id, int? userId)
    {
        var fund = await _context.Set<MutualFund>().FindAsync(id);
        if (fund == null) return false;

        _context.Set<MutualFund>().Remove(fund);
        await _context.SaveChangesAsync();

        // Audit Logging
        await _auditLogService.LogAsync(
            action: "Delete",
            entityName: "MutualFund",
            entityId: id,
            oldValues: $"Folio: {fund.FolioNumber}, Scheme: {fund.SchemeName}",
            newValues: null,
            userId: userId
        );

        return true;
    }
}
