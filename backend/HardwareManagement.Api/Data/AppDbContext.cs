using HardwareManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace HardwareManagement.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<HardwareComponent> HardwareComponents => Set<HardwareComponent>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<HardwareItem> HardwareItems => Set<HardwareItem>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<InventoryScan> InventoryScans => Set<InventoryScan>();
    public DbSet<InventoryScanItem> InventoryScanItems => Set<InventoryScanItem>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<LabelPrinter> LabelPrinters => Set<LabelPrinter>();
    public DbSet<PrintSize> PrintSizes => Set<PrintSize>();
    public DbSet<BarcodeQueueItem> BarcodeQueueItems => Set<BarcodeQueueItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(x => x.Username).IsUnique();
            entity.Property(x => x.Username).HasMaxLength(100);
            entity.Property(x => x.FullName).HasMaxLength(200);
        });

        modelBuilder.Entity<HardwareComponent>(entity =>
        {
            entity.HasIndex(x => x.Name).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.HasIndex(x => x.CodePrefix).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(x => x.Name).HasMaxLength(150);
            entity.Property(x => x.CodePrefix).HasMaxLength(20);
            entity.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Brand>(entity =>
        {
            entity.HasIndex(x => new { x.HardwareComponentId, x.Name }).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.HasIndex(x => new { x.HardwareComponentId, x.Code }).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(x => x.Name).HasMaxLength(150);
            entity.Property(x => x.Code).HasMaxLength(20);
            entity.HasOne(x => x.HardwareComponent).WithMany(x => x.Brands).HasForeignKey(x => x.HardwareComponentId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<HardwareItem>(entity =>
        {
            entity.HasIndex(x => x.UniqueCode).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(x => x.UniqueCode).HasMaxLength(120);
            entity.Property(x => x.HandedTo).HasMaxLength(200);
            entity.Property(x => x.ReplacedItemCode).HasMaxLength(120);
            entity.Property(x => x.ReplacedPerson).HasMaxLength(200);
            entity.Property(x => x.ReplacedTo).HasMaxLength(200);
            entity.Property(x => x.NotWorkingReason).HasMaxLength(1000);
            entity.Property(x => x.PersonChangeReason).HasMaxLength(1000);
            entity.HasOne(x => x.Brand).WithMany(x => x.Items).HasForeignKey(x => x.BrandId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.OriginalEmployee).WithMany(x => x.OriginalItems).HasForeignKey(x => x.OriginalEmployeeId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.CurrentEmployee).WithMany(x => x.CurrentItems).HasForeignKey(x => x.CurrentEmployeeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasIndex(x => x.FullName).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(x => x.FullName).HasMaxLength(200);
            entity.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Department).WithMany(x => x.Employees).HasForeignKey(x => x.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasIndex(x => x.Name).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(x => x.Name).HasMaxLength(150);
            entity.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InventoryScan>(entity =>
        {
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.AuditDate).HasColumnType("date");
            entity.HasIndex(x => x.AuditDate).IsUnique().HasFilter("[AuditDate] IS NOT NULL");
            entity.HasOne(x => x.CreatedByUser).WithMany(x => x.InventoryScans).HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InventoryScanItem>(entity =>
        {
            entity.HasIndex(x => new { x.InventoryScanId, x.HardwareItemId }).IsUnique();
            entity.Property(x => x.UniqueCode).HasMaxLength(120);
            entity.Property(x => x.ComponentName).HasMaxLength(150);
            entity.Property(x => x.BrandName).HasMaxLength(150);
            entity.Property(x => x.HolderName).HasMaxLength(200);
            entity.Property(x => x.OriginalEmployeeName).HasMaxLength(200);
            entity.Property(x => x.Notes).HasMaxLength(1000);
            entity.Property(x => x.NotWorkingReason).HasMaxLength(1000);
            entity.HasOne(x => x.InventoryScan).WithMany(x => x.ScanItems).HasForeignKey(x => x.InventoryScanId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.HardwareItem).WithMany(x => x.ScanItems).HasForeignKey(x => x.HardwareItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(x => x.Action).HasMaxLength(100);
            entity.Property(x => x.EntityType).HasMaxLength(100);
            entity.HasOne(x => x.User).WithMany(x => x.AuditLogs).HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<LabelPrinter>(entity =>
        {
            entity.HasIndex(x => x.Name).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(x => x.Name).HasMaxLength(150);
            entity.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PrintSize>(entity =>
        {
            entity.HasIndex(x => new { x.PrinterId, x.Name }).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.Property(x => x.Name).HasMaxLength(80);
            entity.Property(x => x.WidthMm).HasPrecision(8, 2);
            entity.Property(x => x.HeightMm).HasPrecision(8, 2);
            entity.HasOne(x => x.Printer).WithMany(x => x.Sizes).HasForeignKey(x => x.PrinterId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BarcodeQueueItem>(entity =>
        {
            entity.HasIndex(x => x.HardwareItemId).IsUnique().HasFilter("[Status] = 1");
            entity.HasOne(x => x.HardwareItem).WithMany().HasForeignKey(x => x.HardwareItemId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.PrintSize).WithMany(x => x.QueueItems).HasForeignKey(x => x.PrintSizeId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
