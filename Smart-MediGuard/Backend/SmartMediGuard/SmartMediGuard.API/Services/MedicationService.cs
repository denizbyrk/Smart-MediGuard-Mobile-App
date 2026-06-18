using Microsoft.EntityFrameworkCore;
using SmartMediGuard.API.Data;
using SmartMediGuard.API.DTOs;
using SmartMediGuard.API.Models;
using System.Text.Json;

namespace SmartMediGuard.API.Services;

public class MedicationService {

    private readonly AppDbContext db;

    public MedicationService(AppDbContext db) => this.db = db;

    public async Task<List<MedicationResponseDto>> GetByUserIdAsync(int userId) {

        var meds = await this.db.Medications
            .Where(m => m.UserId == userId && m.IsActive)
            .OrderBy(m => m.Name)
            .ToListAsync();

        return meds.Select(ToDto).ToList();
    }

    public async Task<MedicationResponseDto?> GetByIdAsync(int id, int userId) {

        var med = await this.db.Medications
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId && m.IsActive);
        
        return med == null ? null : ToDto(med);
    }

    public async Task<MedicationResponseDto> CreateAsync(int userId, CreateMedicationDto dto) {

        var med = new Medication {

            UserId = userId,
            Name = dto.Name,
            Dosage = dto.Dosage,
            Frequency = dto.Frequency,
            TimeSlots = dto.TimeSlots != null ? JsonSerializer.Serialize(dto.TimeSlots) : null,
            StockCount = dto.StockCount,
            StockWarningThreshold = dto.StockWarningThreshold,
            Instructions = dto.Instructions,
            ColorCode = dto.ColorCode,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
        };

        this.db.Medications.Add(med);
        await this.db.SaveChangesAsync();

        return ToDto(med);
    }

    public async Task<MedicationResponseDto?> UpdateAsync(int id, int userId, UpdateMedicationDto dto) {

        var med = await this.db.Medications
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId && m.IsActive);

        if (med == null) return null;

        if (dto.Name != null) med.Name = dto.Name;
        if (dto.Dosage != null) med.Dosage = dto.Dosage;
        if (dto.Frequency != null) med.Frequency = dto.Frequency;
        if (dto.TimeSlots != null) med.TimeSlots = JsonSerializer.Serialize(dto.TimeSlots);
        if (dto.StockCount.HasValue) med.StockCount = dto.StockCount.Value;
        if (dto.StockWarningThreshold.HasValue) med.StockWarningThreshold = dto.StockWarningThreshold.Value;
        if (dto.Instructions != null) med.Instructions = dto.Instructions;
        if (dto.ColorCode != null) med.ColorCode = dto.ColorCode;
        if (dto.EndDate.HasValue) med.EndDate = dto.EndDate.Value;

        med.UpdatedAt = DateTime.UtcNow;
        await this.db.SaveChangesAsync();

        return ToDto(med);
    }

    public async Task<bool> DeleteAsync(int id, int userId) {

        var med = await this.db.Medications
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId && m.IsActive);
        
        if (med == null) return false;

        med.IsActive = false;
        med.UpdatedAt = DateTime.UtcNow;
        await this.db.SaveChangesAsync();
        
        return true;
    }

    public async Task<bool> DecreaseStockAsync(int id, int userId) {

        var med = await this.db.Medications
            .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId && m.IsActive);
        
        if (med == null) return false;

        if (med.StockCount > 0) med.StockCount--;
        
        med.UpdatedAt = DateTime.UtcNow;
        await this.db.SaveChangesAsync();
        
        return true;
    }

    private static MedicationResponseDto ToDto(Medication m) {

        List<string> slots = [];
        if (!string.IsNullOrEmpty(m.TimeSlots)) {

            try { slots = JsonSerializer.Deserialize<List<string>>(m.TimeSlots) ?? []; }
            catch { }
        }

        return new MedicationResponseDto {

            Id = m.Id,
            Name = m.Name,
            Dosage = m.Dosage,
            Frequency = m.Frequency,
            TimeSlots = slots,
            StockCount = m.StockCount,
            StockWarningThreshold = m.StockWarningThreshold,
            Instructions = m.Instructions,
            ColorCode = m.ColorCode,
            StartDate = m.StartDate,
            EndDate = m.EndDate,
            IsActive = m.IsActive,
            CreatedAt = m.CreatedAt,
            UpdatedAt = m.UpdatedAt,
        };
    }
}