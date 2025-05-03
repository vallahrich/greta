using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using PeriodTracker.Model.Repositories;

namespace PeriodTracker.API.Middleware
{
    public class BasicAuthenticationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IServiceProvider _serviceProvider;

        public BasicAuthenticationMiddleware(RequestDelegate next, IServiceProvider serviceProvider)
        {
            _next = next;
            _serviceProvider = serviceProvider;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                var path = context.Request.Path.ToString().ToLower();
                
                // Check for [AllowAnonymous] attribute on the endpoint
                var endpoint = context.GetEndpoint();
                if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() != null)
                {
                    await _next(context);
                    return;
                }

                // Check for specific exempt paths (login and register)
                if (path.EndsWith("/api/auth/login") || 
                    path.EndsWith("/api/auth/register") || 
                    path.Contains("/api/user/exists/"))
                {
                    await _next(context);
                    return;
                }

                // Get the Authorization header
                string? authHeader = context.Request.Headers.Authorization;
                
                // If no Authorization header is present, return 401 Unauthorized
                if (string.IsNullOrEmpty(authHeader))
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Authorization header is required");
                    return;
                }

                // Check if it's a valid Basic Auth header
                if (!authHeader.StartsWith("Basic "))
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Invalid Authorization header format");
                    return;
                }

                // Extract and decode the Base64 credentials
                var encodedCredentials = authHeader.Substring(6); // Skip "Basic "
                byte[] bytes;
                
                try 
                {
                    bytes = Convert.FromBase64String(encodedCredentials);
                }
                catch (FormatException)
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Invalid Base64 encoding in Authorization header");
                    return;
                }
                
                var credentials = Encoding.UTF8.GetString(bytes);
                
                // Split into email:password
                var credentialParts = credentials.Split(':');
                if (credentialParts.Length != 2)
                {
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Invalid credentials format");
                    return;
                }
                
                var userEmail = credentialParts[0]; 
                var userPassword = credentialParts[1];
                
                // Validate against database
                using (var scope = _serviceProvider.CreateScope())
                {
                    var userRepository = scope.ServiceProvider.GetRequiredService<UserRepository>();
                    
                    // Check if test user
                    if (userEmail == "john.doe" && userPassword == "VerySecret!")
                    {
                        context.Items["UserEmail"] = userEmail;
                        context.Items["UserId"] = 1; // Test user ID
                        await _next(context);
                        return;
                    }
                    
                    // Validate against database
                    var user = userRepository.GetUserByEmail(userEmail);
                    if (user != null && user.Pw == userPassword)
                    {
                        // Store user information in context for controllers to use
                        context.Items["UserEmail"] = userEmail;
                        context.Items["UserId"] = user.UserId;
                        
                        await _next(context);
                        return;
                    }
                }
                
                // If we get here, credentials are invalid
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Invalid credentials");
                return;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AUTH] Error: {ex.Message}");
                context.Response.StatusCode = 500;
                await context.Response.WriteAsync("An internal server error occurred during authentication");
            }
        }
    }

    public static class BasicAuthenticationMiddlewareExtensions
    {
        public static IApplicationBuilder UseBasicAuthenticationMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<BasicAuthenticationMiddleware>();
        }
    }
}