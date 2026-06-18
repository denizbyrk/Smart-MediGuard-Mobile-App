using Microsoft.EntityFrameworkCore;
using SmartMediGuard.API.Data;
using SmartMediGuard.API.DTOs;
using SmartMediGuard.API.Models;

namespace SmartMediGuard.API.Services;

public class DoseHistoryService {

    private readonly AppDbContext db;

    public DoseHistoryService(AppDbContext db) => this.db = db;

    public async Task<List<DoseHistoryResponseDto>> GetByMedicationAsync(int medicationId, int days = 7) {

        var since = DateTime.UtcNow.AddDays(-days);
        var doses = await this.db.DoseHistories
            .Include(d => d.Medication)
            .Where(d => d.MedicationId == medicationId && d.ScheduledTime >= since)
            .OrderByDescending(d => d.ScheduledTime)
            .ToListAsync();

        return doses.Select(ToDto).ToList();
    }

    public async Task<List<DoseHistoryResponseDto>> GetTodaysAsync(int userId) {

        var todayStart = DateTime.UtcNow.Date;
        var todayEnd   = todayStart.AddDays(1);

        var doses = await this.db.DoseHistories
            .Include(d => d.Medication)
            .Where(d => d.Medication!.UserId == userId
                     && d.ScheduledTime >= todayStart
                     && d.ScheduledTime < todayEnd)
            .OrderBy(d => d.ScheduledTime)
            .ToListAsync();

        return doses.Select(ToDto).ToList();
    }

    public async Task<DoseHistoryResponseDto> CreateAsync(CreateDoseDto dto) {

        var dose = new DoseHistory {

            MedicationId  = dto.MedicationId,
            ScheduledTime = dto.ScheduledTime,
            Status = "pending",
        };

        this.db.DoseHistories.Add(dose);
        await this.db.SaveChangesAsync();

        await this.db.Entry(dose).Reference(d => d.Medication).LoadAsync();
        return ToDto(dose);
    }

    public async Task<DoseHistoryResponseDto?> UpdateStatusAsync(int id, UpdateDoseStatusDto dto) {

        var dose = await this.db.DoseHistories
            .Include(d => d.Medication)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dose == null) return null;

        dose.Status = dto.Status;
        if (dto.Status == "taken") dose.TakenTime = DateTime.UtcNow;
        await this.db.SaveChangesAsync();

        return ToDto(dose);
    }

    public async Task<AdherenceDto> GetAdherenceAsync(int medicationId, int days = 30) {

        var since = DateTime.UtcNow.AddDays(-days);
        var med = await this.db.Medications.FindAsync(medicationId);

        var doses = await this.db.DoseHistories
            .Where(d => d.MedicationId == medicationId
                     && d.ScheduledTime >= since
                     && d.Status != "pending")
            .ToListAsync();

        var total  = doses.Count;
        var taken  = doses.Count(d => d.Status == "taken");
        var missed = doses.Count(d => d.Status == "missed");

        return new AdherenceDto {

            MedicationId = medicationId,
            MedicationName = med?.Name ?? "",
            TotalDoses = total,
            TakenDoses = taken,
            MissedDoses = missed,
            AdherenceRate = total > 0 ? Math.Round((double)taken / total * 100, 1) : 0,
        };
    }

    private static DoseHistoryResponseDto ToDto(DoseHistory d) => new() {

        Id = d.Id,
        MedicationId = d.MedicationId,
        MedicationName = d.Medication?.Name ?? "",
        ScheduledTime = d.ScheduledTime,
        TakenTime = d.TakenTime,
        Status = d.Status,
        CreatedAt = d.CreatedAt,
    };
}