using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PolicyManager.API.Data;
using PolicyManager.API.DTOs;
using PolicyManager.API.Helpers;
using PolicyManager.API.Models;

namespace PolicyManager.API.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto> LoginAsync(LoginDto dto);
        Task<AuthResponseDto> RegisterAsync(RegisterDto dto);
        Task<List<UserDto>> GetAllUsersAsync();
        Task<UserDto?> GetUserByIdAsync(int id);
    }

    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IMapper _mapper;
        private readonly ILogger<AuthService> _logger;

        public AuthService(AppDbContext context, IConfiguration configuration,
            IMapper mapper, ILogger<AuthService> logger)
        {
            _context = context;
            _configuration = configuration;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid email or password.");

            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var token = JwtHelper.GenerateToken(user.Id, user.Email, user.FullName, user.Role, _configuration, dto.RememberMe);
            
            double expirationMinutes = Convert.ToDouble(_configuration["JwtSettings:ExpirationInMinutes"]);
            if (dto.RememberMe) expirationMinutes = 7 * 24 * 60; // 7 days

            var expiration = DateTime.UtcNow.AddMinutes(expirationMinutes);

            _logger.LogInformation("User {Email} logged in successfully", user.Email);

            return new AuthResponseDto
            {
                Token = token,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                Expiration = expiration
            };
        }

        public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                throw new ArgumentException("A user with this email already exists.");

            var user = _mapper.Map<User>(dto);
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            // Default role is User
            if (string.IsNullOrEmpty(user.Role))
            {
                user.Role = PolicyConstants.RoleUser;
            }

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var token = JwtHelper.GenerateToken(user.Id, user.Email, user.FullName, user.Role, _configuration);
            var expiration = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["JwtSettings:ExpirationInMinutes"]));

            _logger.LogInformation("New user registered: {Email}", user.Email);

            return new AuthResponseDto
            {
                Token = token,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                Expiration = expiration
            };
        }

        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            var users = await _context.Users.AsNoTracking().OrderByDescending(u => u.CreatedAt).ToListAsync();
            return _mapper.Map<List<UserDto>>(users);
        }

        public async Task<UserDto?> GetUserByIdAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            return user != null ? _mapper.Map<UserDto>(user) : null;
        }
    }
}
