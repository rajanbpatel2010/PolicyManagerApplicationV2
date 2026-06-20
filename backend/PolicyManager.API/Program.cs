using PolicyManager.API.Data;
using PolicyManager.API.Mappings;
using PolicyManager.API.Middleware;
using PolicyManager.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;
using AspNetCoreRateLimit;

// ──────────────────────────────────────────────────────────────
//  Configure Serilog early (before app builder)
// ──────────────────────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File(Path.Combine(AppContext.BaseDirectory, "Logs", "startup-.txt"), rollingInterval: RollingInterval.Day)
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting Policy Manager API...");
    Log.Information($"AppContext.BaseDirectory: {AppContext.BaseDirectory}");
    Log.Information($"CurrentDirectory: {Directory.GetCurrentDirectory()}");

    // Enable legacy timestamp behavior for easier migration from SQL Server's Unspecified DateTime
    AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

    Log.Information("Creating WebApplicationBuilder...");
    var builder = WebApplication.CreateBuilder(new WebApplicationOptions
    {
        Args = args,
        ContentRootPath = AppContext.BaseDirectory
    });

    // Development: use User Secrets (dotnet user-secrets set "GeminiApi:ApiKey" "AIza...")
    if (builder.Environment.IsDevelopment())
    {
        builder.Configuration.AddUserSecrets<Program>();
    }

    // Production: use environment variables (GeminiApi__ApiKey=AIza...)
    builder.Configuration.AddEnvironmentVariables();

    Log.Information("Configuring Windows Service...");
    builder.Host.UseWindowsService();

    Log.Information("Configuring Serilog...");
    builder.Host.UseSerilog((context, services, configuration) =>
    {
        configuration
            .MinimumLevel.Information()
            .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
            .Enrich.FromLogContext()
            .WriteTo.Console()
            .WriteTo.File(Path.Combine(AppContext.BaseDirectory, "Logs", "log-.txt"), rollingInterval: RollingInterval.Day);
    });

    // ── Rate Limiting ───────────────────────────────────────
    builder.Services.AddMemoryCache();
    builder.Services.Configure<IpRateLimitOptions>(options =>
    {
        options.EnableEndpointRateLimiting = true;
        options.StackBlockedRequests = false;
        options.HttpStatusCode = 429;
        options.RealIpHeader = "X-Real-IP";
        options.GeneralRules = new List<RateLimitRule>
        {
            new RateLimitRule
            {
                Endpoint = "*",
                Period = "1m",
                Limit = 100,        // 100 requests per minute per IP globally
            },
            new RateLimitRule
            {
                Endpoint = "POST:/api/auth/login",
                Period = "1m",
                Limit = 5,          // 5 login attempts per minute per IP
            },
            new RateLimitRule
            {
                Endpoint = "POST:/api/auth/register",
                Period = "1h",
                Limit = 3,          // 3 registrations per hour per IP
            },
        };
    });
    builder.Services.AddInMemoryRateLimiting();
    builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();

    Log.Information("Configuring Database...");
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrEmpty(databaseUrl))
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':');
        var port = uri.Port > 0 ? uri.Port : 5432;
        connectionString = $"Host={uri.Host};Port={port};Database={uri.LocalPath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true;";
    }

    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseNpgsql(
            connectionString,
            npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 3,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorCodesToAdd: null);
            }));

    Log.Information("Configuring JWT...");
    var jwtSettings = builder.Configuration.GetSection("JwtSettings");
    var secretKeyString = jwtSettings["SecretKey"];
    if (string.IsNullOrEmpty(secretKeyString))
    {
        Log.Error("JWT SecretKey is missing in configuration!");
        throw new Exception("JWT SecretKey is missing!");
    }
    var secretKey = Encoding.UTF8.GetBytes(secretKeyString);

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(secretKey),
            ClockSkew = TimeSpan.Zero
        };
    });

    builder.Services.AddAuthorization(options =>
    {
        options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
        options.AddPolicy("UserOrAdmin", policy => policy.RequireRole("User", "Admin"));
    });

    // ── AutoMapper ──────────────────────────────────────────
    builder.Services.AddAutoMapper(typeof(MappingProfile));

    // ── Dependency Injection – Services ─────────────────────
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IPolicyService, PolicyService>();
    builder.Services.AddScoped<IPolicyTypeService, PolicyTypeService>();
    builder.Services.AddScoped<IDashboardService, DashboardService>();
    builder.Services.AddScoped<IFamilyMemberService, FamilyMemberService>();
    builder.Services.AddScoped<IAuditLogService, AuditLogService>();
    builder.Services.AddScoped<IMutualFundService, MutualFundService>();
    builder.Services.AddScoped<IReminderService, ReminderService>();
    builder.Services.AddScoped<IPolicyAnalysisService, PolicyAnalysisService>();
    builder.Services.AddScoped<INotificationService, NotificationService>();
    builder.Services.AddScoped<IInvestmentForecastService, InvestmentForecastService>();
    builder.Services.AddScoped<ITaxIntelligenceService, TaxIntelligenceService>();
    builder.Services.AddScoped<IGeminiOrchestratorService, GeminiOrchestratorService>();
    builder.Services.AddScoped<IIrrCalculatorService, IrrCalculatorService>();
    builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));
    builder.Services.AddHttpClient();

    // ── Email Reminder Scheduler ────────────────────────────
    var emailReminderSettings = builder.Configuration
        .GetSection(EmailReminderSettings.SectionName)
        .Get<EmailReminderSettings>() ?? new EmailReminderSettings();
    builder.Services.AddSingleton(emailReminderSettings);
    builder.Services.AddScoped<IEmailService, EmailService>();
    builder.Services.AddHostedService<PolicyReminderScheduler>();

    // ── CORS ────────────────────────────────────────────────
    var corsOrigins = builder.Configuration
        .GetSection("CorsOrigins").Get<string[]>() ?? new[] { "http://localhost:4200" };

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("DevelopmentCors", policy =>
            policy.WithOrigins("http://localhost:4200", "http://localhost:4210")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials());

        options.AddPolicy("ProductionCors", policy =>
            policy.WithOrigins(corsOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials()
                  .SetPreflightMaxAge(TimeSpan.FromMinutes(10)));
    });

    // ── Controllers + JSON options ──────────────────────────
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy =
                System.Text.Json.JsonNamingPolicy.CamelCase;
            options.JsonSerializerOptions.DefaultIgnoreCondition =
                System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
            options.JsonSerializerOptions.Converters.Add(new PolicyManager.API.Helpers.DateTimeUtcConverter());
            options.JsonSerializerOptions.Converters.Add(new PolicyManager.API.Helpers.NullableDateTimeUtcConverter());
        });

    // ── Swagger / OpenAPI ───────────────────────────────────
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "Policy Manager API",
            Version = "v1",
            Description = "A comprehensive Policy Management System API built with ASP.NET Core 8",
            Contact = new OpenApiContact
            {
                Name = "Policy Manager Support",
                Email = "rajanbpatel2017@gmail.com"
            }
        });

        // JWT Bearer token in Swagger UI
        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Enter your JWT token"
        });

        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });

    // ── Redis Caching ──────────────────────────────────────
    var redisConn = builder.Configuration.GetConnectionString("Redis");
    if (!string.IsNullOrEmpty(redisConn))
    {
        builder.Services.AddStackExchangeRedisCache(options =>
        {
            options.Configuration = redisConn;
            options.InstanceName = "PolicyManager_";
        });
    }
    else
    {
        builder.Services.AddDistributedMemoryCache();
    }

    builder.Services.AddResponseCaching();
    builder.Services.AddResponseCompression();

    // ── Health checks ───────────────────────────────────────
    builder.Services.AddHealthChecks()
        .AddNpgSql(connectionString!);

    Log.Information("Building the application...");
    var app = builder.Build();

    Log.Information("Application built successfully.");

    // ── Global Exception Handling Middleware ─────────────────
    app.UseMiddleware<ExceptionMiddleware>();

    // ── Rate Limiting Middleware ────────────────────────────
    app.UseIpRateLimiting();

    // ── Request logging (Serilog) ───────────────────────────
    app.UseSerilogRequestLogging();

    // ── Swagger (available in all environments for now) ─────
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Policy Manager API v1");
        c.RoutePrefix = "swagger";
    });

    // ── Standard middleware pipeline ────────────────────────
    app.UseHttpsRedirection();
    if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
    }

    // Add security headers middleware
    app.Use(async (context, next) =>
    {
        context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
        context.Response.Headers.Append("X-Frame-Options", "DENY");
        context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
        context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
        context.Response.Headers.Append(
            "Content-Security-Policy",
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' data: https://fonts.gstatic.com; " +
            "img-src 'self' data:; " +
            "connect-src 'self' https://generativelanguage.googleapis.com");
        await next();
    });
    app.UseDefaultFiles();
    app.UseStaticFiles();

    app.UseResponseCompression();
    app.UseResponseCaching();
    
    if (app.Environment.IsDevelopment())
        app.UseCors("DevelopmentCors");
    else
        app.UseCors("ProductionCors");

    app.UseAuthentication();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/health");
    app.MapFallbackToFile("index.html");

    // ── Auto-migrate & seed on startup ──────────────────────
    Log.Information("Starting Database Migration scope...");
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            Log.Information("Applying migrations...");
            db.Database.Migrate();
            Log.Information("Migrations applied successfully.");
        }
        catch (Exception migrationEx)
        {
            // Tables may already exist if DB was created via setup.sql
            Log.Warning(migrationEx, "Migration skipped (tables may already exist). Ensuring DB connectivity...");
            // Verify we can at least connect
            db.Database.CanConnect();
        }
        Log.Information("Seeding data...");
        await AppDbContext.SeedDataAsync(db);
        Log.Information("Data seeding completed.");
    }

    Log.Information("Starting the application (app.Run)...");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
