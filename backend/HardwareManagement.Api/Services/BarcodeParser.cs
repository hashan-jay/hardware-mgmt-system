namespace HardwareManagement.Api.Services;

public sealed record ParsedBarcode(
    string RawCode,
    int SequenceNumber,
    bool IsNewAcquisition,
    string? ComponentPrefix,
    string? BrandCode);

public static class BarcodeParser
{
    public static bool TryParse(string? input, out ParsedBarcode parsed, out string error)
    {
        parsed = new ParsedBarcode(string.Empty, 0, false, null, null);
        error = string.Empty;

        if (string.IsNullOrWhiteSpace(input))
        {
            error = "Barcode value is required.";
            return false;
        }

        var raw = input.Trim().ToUpperInvariant();
        var parts = raw.Split('-', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        // Number-only barcode: "12"
        if (parts.Length == 1)
        {
            if (!int.TryParse(parts[0], out var numberOnly) || numberOnly <= 0)
            {
                error = "Barcode number must be a positive integer.";
                return false;
            }

            parsed = new ParsedBarcode(raw, numberOnly, false, null, null);
            return true;
        }

        // Existing: PREFIX-BRAND-NUMBER
        // New: NEW-PREFIX-BRAND-NUMBER
        var isNew = parts[0] == "NEW";
        string[] body;

        if (isNew)
        {
            if (parts.Length != 4)
            {
                error = "New-item barcode must look like NEW-MINI-LENOVO-12.";
                return false;
            }

            body = parts[1..];
        }
        else
        {
            if (parts.Length != 3)
            {
                error = "Barcode must look like MINI-LENOVO-12 (or NEW-MINI-LENOVO-12).";
                return false;
            }

            body = parts;
        }

        if (!int.TryParse(body[2], out var sequence) || sequence <= 0)
        {
            error = "The barcode number segment must be a positive integer and cannot be changed.";
            return false;
        }

        parsed = new ParsedBarcode(raw, sequence, isNew, body[0], body[1]);
        return true;
    }

    public static string BuildUniqueCode(string componentPrefix, string brandCode, int sequenceNumber, bool isNewAcquisition)
    {
        var code = $"{componentPrefix.Trim().ToUpperInvariant()}-{brandCode.Trim().ToUpperInvariant()}-{sequenceNumber}";
        return isNewAcquisition ? $"NEW-{code}" : code;
    }
}
