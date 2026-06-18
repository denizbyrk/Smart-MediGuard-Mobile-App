namespace SmartMediGuard.API.DTOs;

public class CreateDoseDto {

    public int MedicationId { get; set; }
    public DateTime ScheduledTime { get; set; }
}

public class UpdateDoseStatusDto {

    public string Status { get; set; } = string.Empty; // taken | missed | snoozed
}

public class DoseHistoryResponseDto {

    public int Id { get; set; }
    public int MedicationId { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public DateTime ScheduledTime { get; set; }
    public DateTime? TakenTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class AdherenceDto {

    public int MedicationId { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public int TotalDoses { get; set; }
    public int TakenDoses { get; set; }
    public int MissedDoses { get; set; }
    public double AdherenceRate { get; set; }
}