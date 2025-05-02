using PeriodTracker.API.Middleware;
using PeriodTracker.Model.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
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
        builder.WithOrigins("http://localhost:4200") // Angular app's default URL
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials()  // Allow credentials
               .WithExposedHeaders("Authorization");
    });
});

// Configure authorization policies
builder.Services.AddAuthorization(options =>
{
    // Default policy - requires authenticated user
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    
    // Add detailed exception handling in development
    app.UseDeveloperExceptionPage();
}
else
{
    // Use more production-appropriate error handling
    app.UseExceptionHandler("/error");
    app.UseHsts();
}

// Enable CORS - must come before authentication middleware
app.UseCors("AllowAngularApp");

// Add Basic Authentication middleware before Authorization
app.UseBasicAuthenticationMiddleware();

// Use authorization middleware
app.UseAuthorization();

// Map API controllers
app.MapControllers();

// Add this to ensure unauthorized requests are properly handled
app.Use(async (context, next) =>
{
    await next();
    
    // If we get here with a 401, it means the request wasn't handled
    // by an endpoint - return a proper 401 response
    if (context.Response.StatusCode == 401 && 
        !context.Response.HasStarted && 
        !context.Request.Path.StartsWithSegments("/error"))
    {
        await context.Response.WriteAsJsonAsync(new { message = "Authentication required" });
    }
});

// Start the application
Console.WriteLine("Starting application...");
app.Run();