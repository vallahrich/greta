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
            // Always allow OPTIONS requests for CORS preflight
            if (context.Request.Method == "OPTIONS")
            {
                await _next(context);
                return;
            }

            // Skip auth for anonymous endpoints
            var endpoint = context.GetEndpoint();
            if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() != null)
            {
                await _next(context);
                return;
            }

            // Check authorization header
            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Basic "))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Authorization header missing or invalid");
                return;
            }

            try
            {
                // Decrypt credentials
                AuthenticationHelper.Decrypt(authHeader, out var userEmail, out var userPassword);

                // Verify credentials against database
                using var scope = _serviceProvider.CreateScope();
                var userRepository = scope.ServiceProvider.GetRequiredService<UserRepository>();
                var user = userRepository.GetUserByEmail(userEmail);

                if (user != null && user.Pw == userPassword)
                {
                    // Store user info for controllers
                    context.Items["UserEmail"] = userEmail;
                    context.Items["UserId"] = user.UserId;
                    await _next(context);
                }
                else
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsync("Invalid credentials");
                }
            }
            catch (Exception ex)
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Authentication error");
            }
        }
    }

    // Extension method to wire up middleware in Startup/Program
    public static class BasicAuthenticationMiddlewareExtensions
    {
        public static IApplicationBuilder UseBasicAuthenticationMiddleware(this IApplicationBuilder builder)
            => builder.UseMiddleware<BasicAuthenticationMiddleware>();
    }
}
