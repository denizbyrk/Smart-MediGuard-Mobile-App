using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartMediGuard.API.DTOs;
using SmartMediGuard.API.Services;
using System.Security.Claims;

namespace SmartMediGuard.API.Controllers;

[ApiController]
[Route("api/dose-history")]
[Authorize]
public class DoseHistoryController : ControllerBase {

    private readonly DoseHistoryService svc;

    public DoseHistoryController(DoseHistoryService svc) => this.svc = svc;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    //GET /api/dose-history/today
    [HttpGet("today")]
    public async Task<IActionResult> GetToday()
        => Ok(await this.svc.GetTodaysAsync(UserId));

    //GET /api/dose-history/medication/{medicationId}?days=7
    [HttpGet("medication/{medicationId}")]
    public async Task<IActionResult> GetByMedication(int medicationId, [FromQuery] int days = 7)
        => Ok(await this.svc.GetByMedicationAsync(medicationId, days));

    //GET /api/dose-history/adherence/{medicationId}?days=30
    [HttpGet("adherence/{medicationId}")]
    public async Task<IActionResult> GetAdherence(int medicationId, [FromQuery] int days = 30)
        => Ok(await this.svc.GetAdherenceAsync(medicationId, days));

    //POST /api/dose-history
    [HttpPost]
    public async Task<IActionResult> Create(CreateDoseDto dto) {

        var dose = await this.svc.CreateAsync(dto);

        return Ok(dose);
    }

    //PATCH /api/dose-history/{id}/status
    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, UpdateDoseStatusDto dto) {

        var dose = await this.svc.UpdateStatusAsync(id, dto);

        return dose == null ? NotFound() : Ok(dose);
    }
}