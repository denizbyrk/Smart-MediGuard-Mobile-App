using System.Text.Json;

namespace SmartMediGuard.API.DTOs;

public class CreateMedicationDto {

    public string Name { get; set; } = string.Empty;
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public List<string>? TimeSlots { get; set; }
    public int StockCount { get; set; } = 0;
    public int StockWarningThreshold { get; set; } = 7;
    public string? Instructions { get; set; }
    public string? ColorCode { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}

public class UpdateMedicationDto {

    public string? Name { get; set; }
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public List<string>? TimeSlots { get; set; }
    public int? StockCount { get; set; }
    public int? StockWarningThreshold { get; set; }
    public string? Instructions { get; set; }
    public string? ColorCode { get; set; }
    public DateOnly? EndDate { get; set; }
}

public class MedicationResponseDto {

    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public List<string> TimeSlots { get; set; } = [];
    public int StockCount { get; set; }
    public int StockWarningThreshold { get; set; }
    public string? Instructions { get; set; }
    public string? ColorCode { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
