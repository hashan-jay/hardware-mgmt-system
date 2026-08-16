using HardwareManagement.Api.Models;
using HardwareManagement.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace HardwareManagement.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.EnsureCreatedAsync();
        await AlignSchemaAsync(db);

        if (!db.Users.Any())
        {
            db.Users.AddRange(
                new User
                {
                    Username = "developer",
                    FullName = "System Developer",
                    Role = UserRole.Developer,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Dev@12345")
                },
                new User
                {
                    Username = "netadmin",
                    FullName = "Network Administrator",
                    Role = UserRole.NetworkAdmin,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@12345")
                });

            await db.SaveChangesAsync();
        }

        await NormalizeExistingDataAsync(db);
        await MigrateEmployeesAsync(db);
    }

    private static async Task AlignSchemaAsync(AppDbContext db)
    {
        const string sql = """
            SET QUOTED_IDENTIFIER ON;
            SET ANSI_NULLS ON;
            SET ANSI_PADDING ON;
            SET ANSI_WARNINGS ON;
            SET CONCAT_NULL_YIELDS_NULL ON;
            SET ARITHABORT ON;

            IF COL_LENGTH('HardwareItems', 'HandedTo') IS NULL
                ALTER TABLE HardwareItems ADD HandedTo nvarchar(200) NULL;
            IF COL_LENGTH('HardwareItems', 'HandedDate') IS NULL
                ALTER TABLE HardwareItems ADD HandedDate datetime2 NULL;
            IF COL_LENGTH('HardwareItems', 'ReplacedItemCode') IS NULL
                ALTER TABLE HardwareItems ADD ReplacedItemCode nvarchar(120) NULL;
            IF COL_LENGTH('HardwareItems', 'ReplacedPerson') IS NULL
                ALTER TABLE HardwareItems ADD ReplacedPerson nvarchar(200) NULL;
            IF COL_LENGTH('HardwareItems', 'ReplacedTo') IS NULL
                ALTER TABLE HardwareItems ADD ReplacedTo nvarchar(200) NULL;
            IF COL_LENGTH('HardwareItems', 'ReplacedDate') IS NULL
                ALTER TABLE HardwareItems ADD ReplacedDate datetime2 NULL;
            IF COL_LENGTH('HardwareItems', 'OriginalEmployeeId') IS NULL
                ALTER TABLE HardwareItems ADD OriginalEmployeeId int NULL;
            IF COL_LENGTH('HardwareItems', 'CurrentEmployeeId') IS NULL
                ALTER TABLE HardwareItems ADD CurrentEmployeeId int NULL;
            IF COL_LENGTH('HardwareItems', 'NotWorkingReason') IS NULL
                ALTER TABLE HardwareItems ADD NotWorkingReason nvarchar(1000) NULL;
            IF COL_LENGTH('HardwareItems', 'PersonChangeReason') IS NULL
                ALTER TABLE HardwareItems ADD PersonChangeReason nvarchar(1000) NULL;
            IF COL_LENGTH('HardwareItems', 'OriginalIssuedDate') IS NULL
                ALTER TABLE HardwareItems ADD OriginalIssuedDate datetime2 NULL;

            IF COL_LENGTH('InventoryScans', 'SnapshotReady') IS NULL
                ALTER TABLE InventoryScans ADD SnapshotReady bit NOT NULL CONSTRAINT DF_InventoryScans_SnapshotReady DEFAULT (0);
            IF COL_LENGTH('InventoryScans', 'ExpectedCount') IS NULL
                ALTER TABLE InventoryScans ADD ExpectedCount int NOT NULL CONSTRAINT DF_InventoryScans_ExpectedCount DEFAULT (0);
            IF COL_LENGTH('InventoryScans', 'NewlyFoundCount') IS NULL
                ALTER TABLE InventoryScans ADD NewlyFoundCount int NOT NULL CONSTRAINT DF_InventoryScans_NewlyFoundCount DEFAULT (0);
            IF COL_LENGTH('InventoryScans', 'AuditDate') IS NULL
                ALTER TABLE InventoryScans ADD AuditDate date NULL;

            IF COL_LENGTH('InventoryScanItems', 'IsExpected') IS NULL
                ALTER TABLE InventoryScanItems ADD IsExpected bit NOT NULL CONSTRAINT DF_InventoryScanItems_IsExpected DEFAULT (1);
            IF COL_LENGTH('InventoryScanItems', 'ItemWasCreated') IS NULL
                ALTER TABLE InventoryScanItems ADD ItemWasCreated bit NOT NULL CONSTRAINT DF_InventoryScanItems_ItemWasCreated DEFAULT (0);
            IF COL_LENGTH('InventoryScanItems', 'UniqueCode') IS NULL
                ALTER TABLE InventoryScanItems ADD UniqueCode nvarchar(120) NULL;
            IF COL_LENGTH('InventoryScanItems', 'ComponentName') IS NULL
                ALTER TABLE InventoryScanItems ADD ComponentName nvarchar(150) NULL;
            IF COL_LENGTH('InventoryScanItems', 'BrandName') IS NULL
                ALTER TABLE InventoryScanItems ADD BrandName nvarchar(150) NULL;
            IF COL_LENGTH('InventoryScanItems', 'ComponentId') IS NULL
                ALTER TABLE InventoryScanItems ADD ComponentId int NULL;
            IF COL_LENGTH('InventoryScanItems', 'CurrentEmployeeId') IS NULL
                ALTER TABLE InventoryScanItems ADD CurrentEmployeeId int NULL;
            IF COL_LENGTH('InventoryScanItems', 'HolderName') IS NULL
                ALTER TABLE InventoryScanItems ADD HolderName nvarchar(200) NULL;
            IF COL_LENGTH('InventoryScanItems', 'Issued') IS NULL
                ALTER TABLE InventoryScanItems ADD Issued bit NOT NULL CONSTRAINT DF_InventoryScanItems_Issued DEFAULT (0);
            IF COL_LENGTH('InventoryScanItems', 'NotWorkingReason') IS NULL
                ALTER TABLE InventoryScanItems ADD NotWorkingReason nvarchar(1000) NULL;
            IF COL_LENGTH('InventoryScanItems', 'OriginalEmployeeName') IS NULL
                ALTER TABLE InventoryScanItems ADD OriginalEmployeeName nvarchar(200) NULL;
            IF COL_LENGTH('InventoryScanItems', 'OriginalIssuedDate') IS NULL
                ALTER TABLE InventoryScanItems ADD OriginalIssuedDate datetime2 NULL;
            IF COL_LENGTH('InventoryScanItems', 'HandedDate') IS NULL
                ALTER TABLE InventoryScanItems ADD HandedDate datetime2 NULL;

            ALTER TABLE InventoryScanItems ALTER COLUMN ScannedAt datetime2 NULL;

            IF OBJECT_ID(N'dbo.Employees', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Employees (
                    Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    FullName nvarchar(200) NOT NULL,
                    CreatedAt datetime2 NOT NULL,
                    CreatedByUserId int NOT NULL,
                    IsDeleted bit NOT NULL CONSTRAINT DF_Employees_IsDeleted DEFAULT (0),
                    CONSTRAINT FK_Employees_Users_CreatedByUserId
                        FOREIGN KEY (CreatedByUserId) REFERENCES dbo.Users (Id)
                );
            END;

            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = 'IX_Employees_FullName' AND object_id = OBJECT_ID('Employees'))
                CREATE UNIQUE INDEX IX_Employees_FullName
                    ON Employees (FullName)
                    WHERE [IsDeleted] = 0;

            IF EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = 'IX_HardwareItems_UniqueCode' AND object_id = OBJECT_ID('HardwareItems'))
                DROP INDEX IX_HardwareItems_UniqueCode ON HardwareItems;

            ALTER TABLE HardwareItems ALTER COLUMN UniqueCode nvarchar(120) NOT NULL;

            IF COL_LENGTH('HardwareItems', 'ReplacedItemCode') IS NOT NULL
                ALTER TABLE HardwareItems ALTER COLUMN ReplacedItemCode nvarchar(120) NULL;

            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = 'IX_HardwareItems_UniqueCode' AND object_id = OBJECT_ID('HardwareItems'))
                CREATE UNIQUE INDEX IX_HardwareItems_UniqueCode
                    ON HardwareItems (UniqueCode)
                    WHERE [IsDeleted] = 0;

            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = 'IX_HardwareComponents_Name' AND object_id = OBJECT_ID('HardwareComponents'))
                CREATE UNIQUE INDEX IX_HardwareComponents_Name
                    ON HardwareComponents (Name)
                    WHERE [IsDeleted] = 0;

            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = 'IX_Brands_HardwareComponentId_Name' AND object_id = OBJECT_ID('Brands'))
                CREATE UNIQUE INDEX IX_Brands_HardwareComponentId_Name
                    ON Brands (HardwareComponentId, Name)
                    WHERE [IsDeleted] = 0;

            IF NOT EXISTS (
                SELECT 1 FROM sys.foreign_keys
                WHERE name = 'FK_HardwareItems_Employees_OriginalEmployeeId')
                ALTER TABLE HardwareItems
                    ADD CONSTRAINT FK_HardwareItems_Employees_OriginalEmployeeId
                    FOREIGN KEY (OriginalEmployeeId) REFERENCES Employees (Id);

            IF NOT EXISTS (
                SELECT 1 FROM sys.foreign_keys
                WHERE name = 'FK_HardwareItems_Employees_CurrentEmployeeId')
                ALTER TABLE HardwareItems
                    ADD CONSTRAINT FK_HardwareItems_Employees_CurrentEmployeeId
                    FOREIGN KEY (CurrentEmployeeId) REFERENCES Employees (Id);
            """;

        await db.Database.ExecuteSqlRawAsync(sql);

        const string cleanupSql = """
            SET QUOTED_IDENTIFIER ON;
            DELETE FROM InventoryScanItems
            WHERE InventoryScanId IN (SELECT Id FROM InventoryScans WHERE AuditDate IS NULL);
            DELETE FROM InventoryScans WHERE AuditDate IS NULL;

            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes
                WHERE name = 'IX_InventoryScans_AuditDate' AND object_id = OBJECT_ID('InventoryScans'))
                CREATE UNIQUE INDEX IX_InventoryScans_AuditDate
                    ON InventoryScans (AuditDate)
                    WHERE [AuditDate] IS NOT NULL;
            """;

        await db.Database.ExecuteSqlRawAsync(cleanupSql);
    }

    private static async Task NormalizeExistingDataAsync(AppDbContext db)
    {
        const string sql = """
            SET QUOTED_IDENTIFIER ON;
            SET ANSI_NULLS ON;
            SET ANSI_PADDING ON;
            SET ANSI_WARNINGS ON;
            SET CONCAT_NULL_YIELDS_NULL ON;
            SET ARITHABORT ON;

            UPDATE HardwareComponents
            SET Name = LTRIM(RTRIM(Name)),
                CodePrefix = UPPER(LTRIM(RTRIM(CodePrefix)))
            WHERE Name <> LTRIM(RTRIM(Name))
               OR CodePrefix <> UPPER(LTRIM(RTRIM(CodePrefix)));

            UPDATE Brands
            SET Name = LTRIM(RTRIM(Name)),
                Code = UPPER(LTRIM(RTRIM(Code)))
            WHERE Name <> LTRIM(RTRIM(Name))
               OR Code <> UPPER(LTRIM(RTRIM(Code)));

            UPDATE HardwareItems
            SET UniqueCode = UPPER(LTRIM(RTRIM(UniqueCode)))
            WHERE UniqueCode <> UPPER(LTRIM(RTRIM(UniqueCode)));

            UPDATE HardwareItems
            SET HandedTo = NULL
            WHERE HandedTo IS NOT NULL AND LTRIM(RTRIM(HandedTo)) = '';

            UPDATE HardwareItems
            SET WorkingStatus = 1
            WHERE WorkingStatus NOT IN (1, 2);

            UPDATE HardwareItems
            SET OriginalIssuedDate = HandedDate
            WHERE OriginalIssuedDate IS NULL AND HandedDate IS NOT NULL;
            """;

        await db.Database.ExecuteSqlRawAsync(sql);

        var components = await db.HardwareComponents.Where(x => !x.IsDeleted).ToListAsync();
        foreach (var component in components)
        {
            if (string.IsNullOrWhiteSpace(component.CodePrefix))
                component.CodePrefix = await CodeGenerator.UniqueComponentPrefixAsync(db, component.Name);
        }

        var brands = await db.Brands.Where(x => !x.IsDeleted).ToListAsync();
        foreach (var brand in brands)
        {
            if (string.IsNullOrWhiteSpace(brand.Code) || brand.Code == "-")
                brand.Code = await CodeGenerator.UniqueBrandCodeAsync(db, brand.HardwareComponentId, brand.Name);
        }

        var items = await db.HardwareItems.Where(x => !x.IsDeleted).ToListAsync();
        foreach (var item in items)
        {
            if (item.SequenceNumber <= 0)
                item.SequenceNumber = CodeGenerator.SequenceFromCode(item.UniqueCode, 1);
        }

        await db.SaveChangesAsync();
    }

    private static async Task MigrateEmployeesAsync(AppDbContext db)
    {
        var userId = await db.Users.Select(x => x.Id).FirstOrDefaultAsync();
        if (userId == 0) return;

        var names = await db.HardwareItems
            .Where(x => !x.IsDeleted && x.HandedTo != null && x.HandedTo != "")
            .Select(x => x.HandedTo!)
            .Distinct()
            .ToListAsync();

        foreach (var rawName in names)
        {
            var name = rawName.Trim();
            if (string.IsNullOrWhiteSpace(name)) continue;

            var exists = await db.Employees.AnyAsync(x => !x.IsDeleted && x.FullName.ToLower() == name.ToLower());
            if (exists) continue;

            db.Employees.Add(new Employee
            {
                FullName = name,
                CreatedByUserId = userId
            });
        }

        await db.SaveChangesAsync();

        var employees = await db.Employees.Where(x => !x.IsDeleted).ToListAsync();
        var items = await db.HardwareItems
            .Where(x => !x.IsDeleted && x.HandedTo != null && x.CurrentEmployeeId == null)
            .ToListAsync();

        foreach (var item in items)
        {
            var match = employees.FirstOrDefault(x =>
                x.FullName.Equals(item.HandedTo!.Trim(), StringComparison.OrdinalIgnoreCase));
            if (match is null) continue;

            item.OriginalEmployeeId ??= match.Id;
            item.CurrentEmployeeId = match.Id;
            item.OriginalIssuedDate ??= item.HandedDate;
        }

        await db.SaveChangesAsync();
    }
}
