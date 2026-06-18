using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using SmartMediGuard.API.Data;
using SmartMediGuard.API.DTOs;
using SmartMediGuard.API.Models;

namespace SmartMediGuard.API.Services;

public class SyncService {

    private readonly AppDbContext db;

    private static readonly JsonSerializerOptions jsonOpts = new() {

        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true,
    };

    public SyncService(AppDbContext db) => this.db = db;

    public async Task<SyncResponseDto> SyncAsync(int userId, SyncRequestDto request) {

        int processed = 0;

        foreach (var item in request.Changes) {

            try {

                switch (item.TableName.ToLower()) {

                    case "medications":
                        await SyncMedicationAsync(userId, item);
                        await this.db.SaveChangesAsync(); // reminders/dose_history bunu arar, önce flush et
                        processed++;
                        break;
                    case "dose_history":
                        await SyncDoseHistoryAsync(userId, item);
                        processed++;
                        break;
                    case "reminders":
                        await SyncReminderAsync(userId, item);
                        processed++;
                        break;
                }
            }

            catch (Exception ex) {

                Console.WriteLine($"[Sync] Hata — {item.TableName}#{item.RecordId}: {ex.Message}");
            }
        }

        await this.db.SaveChangesAsync();

        return new SyncResponseDto {

            Success = true,
            ProcessedCount = processed,
            SyncedAt = DateTime.UtcNow,
            Message = $"{processed} değişiklik senkronize edildi.",
        };
    }

    private async Task SyncMedicationAsync(int userId, SyncItemDto item) {

        if (item.Action == "DELETE") {

            var med = await this.db.Medications
                .FirstOrDefaultAsync(m => m.ClientId == item.RecordId && m.UserId == userId);

            if (med != null) { med.IsActive = false; med.UpdatedAt = DateTime.UtcNow; }
            return;
        }

        if (item.Data == null) return;

        var d = JsonSerializer.Deserialize<MedSyncData>(item.Data, SyncService.jsonOpts);
        if (d == null) return;

        var existing = await this.db.Medications
            .FirstOrDefaultAsync(m => m.ClientId == item.RecordId && m.UserId == userId);

        if (existing == null) {

            this.db.Medications.Add(new Medication {

                UserId = userId,
                ClientId = item.RecordId,
                Name = d.Name ?? string.Empty,
                Dosage = d.Dosage,
                Frequency = d.Frequency,
                TimeSlots = d.TimeSlots,
                StockCount = d.StockCount,
                StockWarningThreshold = d.StockWarningThreshold > 0 ? d.StockWarningThreshold : 7,
                Instructions = d.Instructions,
                IsActive = d.IsActive != 0,
                CreatedAt = ParseDate(d.CreatedAt) ?? DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });
        }

        else {

            existing.Name = d.Name ?? existing.Name;
            existing.Dosage = d.Dosage;
            existing.Frequency = d.Frequency;
            existing.TimeSlots = d.TimeSlots;
            existing.StockCount = d.StockCount;
            existing.StockWarningThreshold = d.StockWarningThreshold > 0 ? d.StockWarningThreshold : existing.StockWarningThreshold;
            existing.Instructions = d.Instructions;
            existing.IsActive = d.IsActive != 0;
            existing.UpdatedAt = DateTime.UtcNow;
        }
    }

    private async Task SyncDoseHistoryAsync(int userId, SyncItemDto item) {

        if (item.Data == null) return;

        var d = JsonSerializer.Deserialize<DoseSyncData>(item.Data, SyncService.jsonOpts);
        if (d == null) return;

        var medication = await this.db.Medications
            .FirstOrDefaultAsync(m => m.ClientId == d.MedicationId && m.UserId == userId);
        if (medication == null) return;

        var existing = await this.db.DoseHistories
            .FirstOrDefaultAsync(dh => dh.ClientId == item.RecordId && dh.MedicationId == medication.Id);

        if (existing == null) {

            this.db.DoseHistories.Add(new DoseHistory {

                MedicationId  = medication.Id,
                ClientId = item.RecordId,
                ScheduledTime = ParseDate(d.ScheduledTime) ?? DateTime.UtcNow,
                TakenTime = ParseDate(d.TakenTime),
                Status = d.Status ?? "pending",
                CreatedAt = ParseDate(d.CreatedAt) ?? DateTime.UtcNow,
            });
        }

        else {

            existing.Status    = d.Status ?? existing.Status;
            existing.TakenTime = ParseDate(d.TakenTime);
        }
    }

    private async Task SyncReminderAsync(int userId, SyncItemDto item) {

        if (item.Action == "DELETE") {

            var rem = await this.db.Reminders
                .FirstOrDefaultAsync(r => r.ClientId == item.RecordId && r.Medication!.UserId == userId);
            if (rem != null) rem.IsActive = false;

            return;
        }

        if (item.Data == null) return;

        var d = JsonSerializer.Deserialize<ReminderSyncData>(item.Data, SyncService.jsonOpts);
        if (d == null) return;

        var medication = await this.db.Medications
            .FirstOrDefaultAsync(m => m.ClientId == d.MedicationId && m.UserId == userId);
        if (medication == null) return;

        var existing = await this.db.Reminders
            .FirstOrDefaultAsync(r => r.ClientId == item.RecordId && r.MedicationId == medication.Id);

        if (existing == null) {

            if (!TimeOnly.TryParse(d.ReminderTime, out var time)) return;
            this.db.Reminders.Add(new Reminder {

                MedicationId = medication.Id,
                ClientId = item.RecordId,
                ReminderTime = time,
                IsActive = d.IsActive != 0,
                SnoozeMinutes = d.SnoozeMinutes > 0 ? d.SnoozeMinutes : 15,
            });
        }

        else {

            existing.IsActive = d.IsActive != 0;
            if (TimeOnly.TryParse(d.ReminderTime, out var time))
                existing.ReminderTime = time;
        }
    }

    private static DateTime? ParseDate(string? raw) {

        if (string.IsNullOrEmpty(raw)) return null;
        return DateTime.TryParse(raw, out var dt) ? dt.ToUniversalTime() : null;
    }
}

file class MedSyncData {

    [JsonPropertyName("name")] public string? Name { get; set; }
    [JsonPropertyName("dosage")] public string? Dosage { get; set; }
    [JsonPropertyName("frequency")] public string? Frequency { get; set; }
    [JsonPropertyName("time_slots")] public string? TimeSlots { get; set; }
    [JsonPropertyName("stock_count")] public int StockCount { get; set; }
    [JsonPropertyName("stock_warning_threshold")] public int StockWarningThreshold { get; set; }
    [JsonPropertyName("instructions")] public string? Instructions { get; set; }
    [JsonPropertyName("is_active")] public int IsActive { get; set; } = 1;
    [JsonPropertyName("created_at")] public string? CreatedAt { get; set; }
}

file class DoseSyncData {

    [JsonPropertyName("medication_id")] public int MedicationId { get; set; }
    [JsonPropertyName("scheduled_time")] public string? ScheduledTime { get; set; }
    [JsonPropertyName("taken_time")] public string? TakenTime { get; set; }
    [JsonPropertyName("status")] public string? Status { get; set; }
    [JsonPropertyName("created_at")] public string? CreatedAt { get; set; }
}

file class ReminderSyncData {

    [JsonPropertyName("medication_id")] public int MedicationId { get; set; }
    [JsonPropertyName("reminder_time")] public string? ReminderTime { get; set; }
    [JsonPropertyName("is_active")] public int IsActive { get; set; } = 1;
    [JsonPropertyName("snooze_minutes")] public int SnoozeMinutes { get; set; } = 15;
}