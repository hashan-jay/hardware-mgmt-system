using HardwareManagement.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace HardwareManagement.Api.Services;

public static class CodeGenerator
{
    public static string FromName(string name, int length = 4)
    {
        var chars = name.Where(char.IsLetterOrDigit).ToArray();
        var prefix = new string(chars.Take(length).ToArray()).ToUpperInvariant();
        return prefix.Length >= 2 ? prefix : "ITEM";
    }

    public static async Task<string> UniqueComponentPrefixAsync(AppDbContext db, string name, string? requested = null)
    {
        var basePrefix = string.IsNullOrWhiteSpace(requested)
            ? FromName(name)
            : requested.Trim().ToUpperInvariant();

        var prefix = basePrefix;
        var n = 2;
        while (await db.HardwareComponents.AnyAsync(x => !x.IsDeleted && x.CodePrefix == prefix))
            prefix = $"{basePrefix}{n++}";

        return prefix;
    }

    public static async Task<string> UniqueBrandCodeAsync(AppDbContext db, int componentId, string name, string? requested = null)
    {
        var baseCode = string.IsNullOrWhiteSpace(requested)
            ? FromName(name)
            : requested.Trim().ToUpperInvariant();

        var code = baseCode;
        var n = 2;
        while (await db.Brands.AnyAsync(x =>
                   x.HardwareComponentId == componentId && !x.IsDeleted && x.Code == code))
            code = $"{baseCode}{n++}";

        return code;
    }

    public static int SequenceFromCode(string uniqueCode, int fallback)
    {
        var digits = new string(uniqueCode.Reverse().TakeWhile(char.IsDigit).Reverse().ToArray());
        return int.TryParse(digits, out var n) && n > 0 ? n : fallback;
    }
}
