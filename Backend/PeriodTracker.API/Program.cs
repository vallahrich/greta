/// <summary>
/// Program.cs - Entry point and configuration for PeriodTracker API
/// 
/// This file sets up the ASP.NET Core web application by:
/// - Configuring services (repositories, controllers, CORS, Swagger)
/// - Establishing the middleware pipeline (authentication, routing)
/// - Registering controllers and API endpoints
/// 
/// The application follows a standard repository pattern with controllers
/// that handle REST API endpoints for period tracking functionality.
/// </summary>

using PeriodTracker.API.Middleware;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// SECTION 1: CONFIGURE SERVICES
// Register controllers with JSON serialization options
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        // Use camelCase for JSON property names (JavaScript convention)
        // This converts C# PascalCase to JavaScript camelCase
        opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// Register Swagger for API documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register repositories with scoped lifetime (one instance per request)
// These provide data access for the controllers
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<SymptomRepository>();
builder.Services.AddScoped<PeriodCycleRepository>();
builder.Services.AddScoped<CycleSymptomRepository>();

// Configure CORS to allow requests from the Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policyBuilder =>
    {
        policyBuilder
            .WithOrigins("http://localhost:4200") // Angular dev server URL
            .AllowAnyHeader()                     // Allow all HTTP headers
            .AllowAnyMethod()                     // Allow all HTTP methods (GET, POST, etc.)
            .AllowCredentials()                   // Allow cookies and authentication
            .WithExposedHeaders("Authorization"); // Expose auth header to client
    });
});

// SECTION 2: BUILD THE APP INSTANCE
var app = builder.Build();

// SECTION 3: CONFIGURE THE HTTP REQUEST PIPELINE
// In development, enable Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// IMPORTANT: CORS middleware MUST come BEFORE authentication
// If auth runs first, CORS preflight requests would be rejected
app.UseCors("AllowAngularApp");

// Add our custom authentication middleware
app.UseBasicAuthenticationMiddleware();

// Enable controller routing
app.MapControllers();

// Start the application
app.Run();