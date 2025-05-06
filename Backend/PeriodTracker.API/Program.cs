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