using PeriodTracker.API.Middleware;
using PeriodTracker.Model.Repositories;
using Microsoft.AspNetCore.Authorization;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null; // Keep original casing
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register repositories
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<SymptomRepository>();
builder.Services.AddScoped<PeriodCycleRepository>();
builder.Services.AddScoped<CycleSymptomRepository>();

// Configure CORS to allow requests from Angular application
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", builder =>
    {
        builder.WithOrigins("http://localhost:4200")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable CORS
app.UseCors("AllowAngularApp");

// Add Basic Authentication middleware
app.UseBasicAuthenticationMiddleware();

// Map API controllers
app.MapControllers();

app.Run();