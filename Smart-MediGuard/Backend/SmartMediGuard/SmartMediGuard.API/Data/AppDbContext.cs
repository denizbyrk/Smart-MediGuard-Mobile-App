using Microsoft.EntityFrameworkCore;
using SmartMediGuard.API.Models;

namespace SmartMediGuard.API.Data;

public class AppDbContext : DbContext {

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    //tables
    public DbSet<User> Users => Set<User>();
    public DbSet<Medication> Medications => Set<Medication>();
    public DbSet<DoseHistory> DoseHistories => Set<DoseHistory>();
    public DbSet<Reminder> Reminders => Set<Reminder>();
    public DbSet<DrugInteraction> DrugInteractions => Set<DrugInteraction>();
    public DbSet<PrescriptionScan> PrescriptionScans => Set<PrescriptionScan>();
    public DbSet<SyncLog> SyncLogs => Set<SyncLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) {

        base.OnModelCreating(modelBuilder);

        //email unique index
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        //dose history
        modelBuilder.Entity<DoseHistory>()
            .Property(d => d.Status)
            .HasDefaultValue("pending");

        //drug interaction
        modelBuilder.Entity<DrugInteraction>()
            .HasOne<Medication>()
            .WithMany()
            .HasForeignKey(d => d.Medication1Id)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<DrugInteraction>()
            .HasOne<Medication>()
            .WithMany()
            .HasForeignKey(d => d.Medication2Id)
            .OnDelete(DeleteBehavior.SetNull);
    }
}