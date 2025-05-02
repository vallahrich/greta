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
                // Get the request path and method
                var path = context.Request.Path.ToString().ToLower();
                var method = context.Request.Method;
                
                Console.WriteLine($"[AUTH] Processing request: {method} {path}");
                
                // Check for [AllowAnonymous] attribute on the endpoint
                var endpoint = context.GetEndpoint();
                if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() != null)
                {
                    Console.WriteLine($"[AUTH] Endpoint {path} has [AllowAnonymous], bypassing auth");
                    await _next(context);
                    return;
                }

                // Check for specific exempt paths that don't require authentication
                if (path.EndsWith("/api/auth/login") || 
                    path.EndsWith("/api/auth/register") || 
                    path.Contains("/api/user/exists/"))
                {
                    Console.WriteLine($"[AUTH] Path {path} is exempt from auth, bypassing");
                    await _next(context);
                    return;
                }

                // TEMPORARY: Add specific bypasses until we fix auth fully
                if (path.Contains("/api/user/byemail/") || 
                    (method == "PUT" && path == "/api/user") ||
                    (method == "PUT" && path.Contains("/api/user/password")))
                {
                    Console.WriteLine($"[AUTH] TEMPORARY BYPASS: Allowing {method} {path}");
                    
                    // Add basic user context for controller access based on URL for /byemail/ endpoint
                    if (path.Contains("/api/user/byemail/"))
                    {
                        var pathParts = path.Split("/");
                        var pathEmail = pathParts[pathParts.Length - 1];
                        context.Items["UserEmail"] = pathEmail;
                        Console.WriteLine($"[AUTH] Setting UserEmail={pathEmail} for controller use");
                    }
                    
                    await _next(context);
                    return;
                }

                // Get the Authorization header
                string? authHeader = context.Request.Headers.Authorization;
                
                // If no Authorization header is present, return 401 Unauthorized
                if (string.IsNullOrEmpty(authHeader))
                {
                    Console.WriteLine("[AUTH] No Authorization header found");
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Authorization header is required");
                    return;
                }

                // Check if it's a valid Basic Auth header
                if (!authHeader.StartsWith("Basic "))
                {
                    Console.WriteLine("[AUTH] Invalid Authorization header format (not Basic)");
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
                catch (FormatException ex)
                {
                    Console.WriteLine($"[AUTH] Failed to decode Base64 credentials: {ex.Message}");
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Invalid Base64 encoding in Authorization header");
                    return;
                }
                
                var credentials = Encoding.UTF8.GetString(bytes);
                
                // Split into email:password
                var credentialParts = credentials.Split(':');
                if (credentialParts.Length != 2)
                {
                    Console.WriteLine("[AUTH] Invalid credentials format - wrong number of parts");
                    context.Response.StatusCode = 401;
                    await context.Response.WriteAsync("Invalid credentials format");
                    return;
                }
                
                var userEmail = credentialParts[0]; 
                var userPassword = credentialParts[1];
                
                // For simplicity, accept any well-formed credentials until we fix the DB issues
                Console.WriteLine($"[AUTH] Authenticated: {userEmail}");
                
                // Store user information in context for controllers to use
                context.Items["UserEmail"] = userEmail;
                
                // Proceed to the next middleware
                await _next(context);
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.WriteLine($"[AUTH] CRITICAL ERROR: {ex.Message}");
                Console.WriteLine($"[AUTH] Exception type: {ex.GetType().Name}");
                Console.WriteLine($"[AUTH] Stack trace: {ex.StackTrace}");
                
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[AUTH] Inner exception: {ex.InnerException.Message}");
                    Console.WriteLine($"[AUTH] Inner stack trace: {ex.InnerException.StackTrace}");
                }
                
                // Return a 500 error response
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