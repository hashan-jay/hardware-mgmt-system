using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace HardwareManagement.Api.OpenApi;

internal sealed class BearerSecuritySchemeTransformer(
    IAuthenticationSchemeProvider authenticationSchemeProvider) : IOpenApiDocumentTransformer
{
    public async Task TransformAsync(
        OpenApiDocument document,
        OpenApiDocumentTransformerContext context,
        CancellationToken cancellationToken)
    {
        var schemes = await authenticationSchemeProvider.GetAllSchemesAsync();
        if (!schemes.Any(scheme => scheme.Name == "Bearer"))
            return;

        document.Info ??= new OpenApiInfo();
        document.Info.Title = "Hardware Management API";
        document.Info.Version = "v1";
        document.Info.Description =
            "Office hardware inventory API. Authenticate via POST /api/auth/login, then use the JWT Bearer token.";

        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes["Bearer"] = new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Paste the JWT from /api/auth/login. Example: eyJhbGciOiJIUzI1NiIs..."
        };

        if (document.Paths is null)
            return;

        foreach (var operation in document.Paths.Values
                     .Where(path => path.Operations is not null)
                     .SelectMany(path => path.Operations!.Values))
        {
            operation.Security ??= [];
            operation.Security.Add(new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("Bearer")] = []
            });
        }
    }
}
