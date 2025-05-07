/// <summary>
/// BasicAuthenticationMiddleware - Implements authentication for the API
/// 
/// This middleware intercepts HTTP requests to:
/// - Extract and validate Basic authentication headers
/// - Skip authentication for [AllowAnonymous] endpoints (login/register)
/// - Verify credentials against the user database
/// - Populate the HttpContext with authenticated user information
/// 
/// The authentication flow follows standard HTTP Basic Authentication
/// where credentials are passed in the Authorization header as "Basic base64(email:password)"
/// </summary>

using Microsoft.AspNetCore.Authorization;

namespace PeriodTracker.API.Middleware
{
    public class BasicAuthenticationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IServiceProvider _serviceProvider;

        // Constructor injected with the next middleware delegate and service provider
        public BasicAuthenticationMiddleware(RequestDelegate next, IServiceProvider serviceProvider)
        {
            _next = next;
            _serviceProvider = serviceProvider;
        }

        // Main middleware method invoked for each request
        public async Task InvokeAsync(HttpContext context)
        {
            // STEP 1: Skip auth for CORS preflight requests (OPTIONS)
            // These must be allowed through for cross-origin requests to work
            if (context.Request.Method == "OPTIONS")
            {
                await _next(context);
                return;
            }

            // STEP 2: Skip auth for endpoints with [AllowAnonymous] attribute
            // This allows login and registration endpoints to be accessed without auth
            var endpoint = context.GetEndpoint();
            if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() != null)
            {
                await _next(context);
                return;
            }

            // STEP 3: Check for Authorization header with Basic scheme
            var authHeader = context.Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Basic "))
            {
                // Return 401 Unauthorized if header is missing or invalid
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Authorization header missing or invalid");
                return;
            }

            try
            {
                // STEP 4: Decrypt the Basic auth credentials
                AuthenticationHelper.Decrypt(authHeader, out var userEmail, out var userPassword);

                // STEP 5: Validate credentials against the database
                // Create a scope for the repository to avoid service lifetime issues
                using var scope = _serviceProvider.CreateScope();
                var userRepository = scope.ServiceProvider.GetRequiredService<UserRepository>();
                var user = userRepository.GetUserByEmail(userEmail);

                // If user exists and password matches, authentication succeeds
                if (user != null && user.Pw == userPassword)
                {
                    // STEP 6: Store authenticated user info in HttpContext.Items
                    // This makes it available to downstream controllers
                    context.Items["UserEmail"] = userEmail;
                    context.Items["UserId"] = user.UserId;
                    
                    // Continue to the next middleware in the pipeline
                    await _next(context);
                }
                else
                {
                    // Invalid credentials - return 401 Unauthorized
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsync("Invalid credentials");
                }
            }
            catch (Exception ex)
            {
                // Handle any errors during authentication
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Authentication error");
            }
        }
    }

    // Extension method to register this middleware in Startup/Program
    // Makes the middleware registration cleaner in Program.cs
    public static class BasicAuthenticationMiddlewareExtensions
    {
        public static IApplicationBuilder UseBasicAuthenticationMiddleware(this IApplicationBuilder builder)
            => builder.UseMiddleware<BasicAuthenticationMiddleware>();
    }
}