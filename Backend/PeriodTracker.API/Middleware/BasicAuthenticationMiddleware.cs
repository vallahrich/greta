using Microsoft.AspNetCore.Authorization;      // For IAllowAnonymous

namespace PeriodTracker.API.Middleware
{
    // Ensures incoming requests carry valid Basic Auth credentials
    public class BasicAuthenticationMiddleware
    {
        private readonly RequestDelegate _next;          // Next middleware in pipeline
        private readonly IServiceProvider _serviceProvider; // To resolve scoped services

        // Constructor receives next delegate and root service provider
        public BasicAuthenticationMiddleware(RequestDelegate next, IServiceProvider serviceProvider)
        {
            _next = next;
            _serviceProvider = serviceProvider;
        }

        // Entry point for each HTTP request
        public async Task InvokeAsync(HttpContext context)
        {
            // Allow anonymous endpoints to bypass auth
            var endpoint = context.GetEndpoint();
            if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() != null)
            {
                await _next(context);
                return;
            }

            // Read and validate Authorization header
            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Basic "))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Missing or invalid Authorization header.");
                return;
            }

            // Decode credentials using helper
            AuthenticationHelper.Decrypt(authHeader, out var userEmail, out var userPassword);

            // Verify credentials against database in a scoped repository
            using var scope = _serviceProvider.CreateScope();
            var userRepository = scope.ServiceProvider.GetRequiredService<UserRepository>();
            var user = userRepository.GetUserByEmail(userEmail);

            if (user != null && user.Pw == userPassword)
            {
                // Store user info for downstream consumption
                context.Items["UserEmail"] = userEmail;
                context.Items["UserId"]    = user.UserId;
                await _next(context);
                return;
            }

            // Invalid credentials -> reject request
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            await context.Response.WriteAsync("Invalid credentials.");
        }
    }

    // Extension method to wire up middleware in Startup/Program
    public static class BasicAuthenticationMiddlewareExtensions
    {
        public static IApplicationBuilder UseBasicAuthenticationMiddleware(this IApplicationBuilder builder)
            => builder.UseMiddleware<BasicAuthenticationMiddleware>();
    }
}
