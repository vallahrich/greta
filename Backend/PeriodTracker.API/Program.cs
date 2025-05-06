/// <summary>
/// Program entry point and configuration for the PeriodTracker API.
/// Sets up the ASP.NET Core application, configures services, and establishes the HTTP request pipeline.
/// </summary>
/// <remarks>
/// Key configuration components:
/// - Registers repository services using dependency injection with scoped lifetime
/// - Configures JSON serialization with camelCase naming
/// - Enables Swagger/OpenAPI documentation
/// - Configures CORS for the Angular frontend (http://localhost:4200)
/// - Sets up the HTTP request pipeline with appropriate middleware:
///   - Swagger UI for API documentation (in Development environment only)
///   - CORS middleware to handle cross-origin requests
///   - Custom Basic Authentication middleware for securing API endpoints
///   - Standard controller routing
/// 
/// This configuration establishes a RESTful API for period tracking with
/// authentication, documentation, and proper cross-origin resource sharing.
/// </remarks>

using PeriodTracker.API.Middleware;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Configure services
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        // Use camelCase for JSON property names
        opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register concrete repository implementations with scoped lifetime
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<SymptomRepository>();
builder.Services.AddScoped<PeriodCycleRepository>();
builder.Services.AddScoped<CycleSymptomRepository>();

// Add CORS configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policyBuilder =>
    {
        policyBuilder
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .WithExposedHeaders("Authorization");
    });
});

var app = builder.Build();

// Development-only middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// CRITICAL: CORS MUST come BEFORE authentication middleware
app.UseCors("AllowAngularApp");

// Then authentication middleware
app.UseBasicAuthenticationMiddleware();

// Map controllers
app.MapControllers();

app.Run();