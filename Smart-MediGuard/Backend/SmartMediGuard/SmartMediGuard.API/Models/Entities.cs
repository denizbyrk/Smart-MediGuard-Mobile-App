using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SmartMediGuard.API.Models;

//user
[Table("users")]
public class User {

    [Key, Column("id")]
    public int Id { get; set; }

    [Column("name"), Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Column("email"), MaxLength(150)]
    public string? Email { get; set; }

    [Column("password_hash"), Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("age")]
    public int? Age { get; set; }

    [Column("health_conditions", TypeName = "jsonb")]
    public string? HealthConditions { get; set; }

    [Column("emergency_contact", TypeName = "jsonb")]
    public string? EmergencyContact { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Medication> Medications { get; set; } = [];
    public ICollection<DrugInteraction> DrugInteractions { get; set; } = [];
    public ICollection<PrescriptionScan> PrescriptionScans { get; set; } = [];
    public ICollection<SyncLog> SyncLogs { get; set; } = [];
}

//medications
[Table("medications")]
public class Medication {

    [Key, Column("id")]
    public int Id { get; set; }

    [Column("user_id"), Required]
    public int UserId { get; set; }

    [Column("name"), Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Column("dosage"), MaxLength(50)]
    public string? Dosage { get; set; }

    [Column("frequency"), MaxLength(100)]
    public string? Frequency { get; set; }

    [Column("time_slots", TypeName = "jsonb")]
    public string? TimeSlots { get; set; }

    [Column("stock_count")]
    public int StockCount { get; set; } = 0;

    [Column("stock_warning_threshold")]
    public int StockWarningThreshold { get; set; } = 7;

    [Column("instructions")]
    public string? Instructions { get; set; }

    [Column("image_url")]
    public string? ImageUrl { get; set; }

    [Column("color_code"), MaxLength(10)]
    public string? ColorCode { get; set; }

    [Column("start_date")]
    public DateOnly? StartDate { get; set; }

    [Column("end_date")]
    public DateOnly? EndDate { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("client_id")]
    public int? ClientId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User? User { get; set; }
    public ICollection<DoseHistory> DoseHistories { get; set; } = [];
    public ICollection<Reminder> Reminders { get; set; } = [];
}

//dose history
[Table("dose_history")]
public class DoseHistory {

    [Key, Column("id")]
    public int Id { get; set; }

    [Column("medication_id"), Required]
    public int MedicationId { get; set; }

    [Column("scheduled_time"), Required]
    public DateTime ScheduledTime { get; set; }

    [Column("taken_time")]
    public DateTime? TakenTime { get; set; }

    [Column("status"), MaxLength(10)]
    public string Status { get; set; } = "pending";

    [Column("client_id")]
    public int? ClientId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("MedicationId")]
    public Medication? Medication { get; set; }
}

//reminders
[Table("reminders")]
public class Reminder {

    [Key, Column("id")]
    public int Id { get; set; }

    [Column("medication_id"), Required]
    public int MedicationId { get; set; }

    [Column("reminder_time"), Required]
    public TimeOnly ReminderTime { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("snooze_minutes")]
    public int SnoozeMinutes { get; set; } = 15;

    [Column("client_id")]
    public int? ClientId { get; set; }

    [ForeignKey("MedicationId")]
    public Medication? Medication { get; set; }
}

//drug interactions
[Table("drug_interactions")]
public class DrugInteraction {

    [Key, Column("id")]
    public int Id { get; set; }

    [Column("user_id"), Required]
    public int UserId { get; set; }

    [Column("medication_1_id")]
    public int? Medication1Id { get; set; }

    [Column("medication_2_id")]
    public int? Medication2Id { get; set; }

    [Column("severity"), MaxLength(10)]
    public string? Severity { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("checked_at")]
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User? User { get; set; }
}

//prescription scans
[Table("prescription_scans")]
public class PrescriptionScan {

    [Key, Column("id")]
    public int Id { get; set; }

    [Column("user_id"), Required]
    public int UserId { get; set; }

    [Column("image_url")]
    public string? ImageUrl { get; set; }

    [Column("extracted_data", TypeName = "jsonb")]
    public string? ExtractedData { get; set; }

    [Column("is_confirmed")]
    public bool IsConfirmed { get; set; } = false;

    [Column("scanned_at")]
    public DateTime ScannedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User? User { get; set; }
}

//synchronization log
[Table("sync_log")]
public class SyncLog {

    [Key, Column("id")]
    public int Id { get; set; }

    [Column("user_id"), Required]
    public int UserId { get; set; }

    [Column("table_name"), Required, MaxLength(50)]
    public string TableName { get; set; } = string.Empty;

    [Column("record_id"), Required]
    public int RecordId { get; set; }

    [Column("action"), MaxLength(10)]
    public string Action { get; set; } = string.Empty;

    [Column("synced_at")]
    public DateTime SyncedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey("UserId")]
    public User? User { get; set; }
}