using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PolicyManager.API.Data;
using PolicyManager.API.DTOs;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services
{
    public interface IPolicyTypeService
    {
        Task<List<PolicyTypeDto>> GetAllAsync();
        Task<PolicyTypeDto?> GetByIdAsync(int id);
        Task<PolicyTypeDto> CreateAsync(PolicyTypeDto dto);
        Task<PolicyTypeDto> UpdateAsync(int id, PolicyTypeDto dto);
    }

    public class PolicyTypeService : IPolicyTypeService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public PolicyTypeService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<PolicyTypeDto>> GetAllAsync()
        {
            var types = await _context.PolicyTypes
                .Where(pt => pt.IsActive)
                .OrderBy(pt => pt.Name)
                .ToListAsync();
            return _mapper.Map<List<PolicyTypeDto>>(types);
        }

        public async Task<PolicyTypeDto?> GetByIdAsync(int id)
        {
            var type = await _context.PolicyTypes.FindAsync(id);
            return type != null ? _mapper.Map<PolicyTypeDto>(type) : null;
        }

        public async Task<PolicyTypeDto> CreateAsync(PolicyTypeDto dto)
        {
            var entity = _mapper.Map<PolicyType>(dto);
            _context.PolicyTypes.Add(entity);
            await _context.SaveChangesAsync();
            return _mapper.Map<PolicyTypeDto>(entity);
        }

        public async Task<PolicyTypeDto> UpdateAsync(int id, PolicyTypeDto dto)
        {
            var entity = await _context.PolicyTypes.FindAsync(id)
                ?? throw new KeyNotFoundException($"Policy type with ID {id} not found.");

            entity.Name = dto.Name;
            entity.Description = dto.Description;
            entity.IsActive = dto.IsActive;
            await _context.SaveChangesAsync();

            return _mapper.Map<PolicyTypeDto>(entity);
        }
    }
}
