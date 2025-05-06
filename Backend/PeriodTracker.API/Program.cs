using PeriodTracker.API.Middleware;          // Provides the UseBasicAuthenticationMiddleware extension
using System.Text.Json;                      // JSON options for camelCase naming

var builder = WebApplication.CreateBuilder(args); // Create the web application builder

// Configure services
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        // Use camelCase for JSON property names
        opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

builder.Services.AddEndpointsApiExplorer();       // Enable minimal API descriptions for Swagger
builder.Services.AddSwaggerGen();                 // Register Swagger generator

// Register application repositories with scoped lifetime
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<SymptomRepository>();
builder.Services.AddScoped<PeriodCycleRepository>();
builder.Services.AddScoped<CycleSymptomRepository>();

// Configure CORS to allow Angular client access
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policyBuilder =>
    {
        policyBuilder
            .WithOrigins("http://localhost:4200") // Angular dev server origin
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();                   // Allow cookies/auth headers
    });
});

var app = builder.Build(); // Build the WebApplication

// Development-only middleware for API docs
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable CORS policy
app.UseCors("AllowAngularApp");

// Add custom Basic Authentication middleware
app.UseBasicAuthenticationMiddleware();

// Map attribute-routed controllers
app.MapControllers();

// Start the app
app.Run();