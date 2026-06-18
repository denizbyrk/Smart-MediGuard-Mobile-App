using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartMediGuard.API.DTOs;
using SmartMediGuard.API.Services;
using System.Security.Claims;

namespace SmartMediGuard.API.Controllers;

[ApiController]
[Route("api/medications")]
[Authorize]
public class MedicationsController : ControllerBase {

    private readonly MedicationService svc;

    public MedicationsController(MedicationService svc) => this.svc = svc;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    //GET /api/medications
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await this.svc.GetByUserIdAsync(UserId));

    //GET /api/medications/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id) {

        var med = await this.svc.GetByIdAsync(id, UserId);
        return med == null ? NotFound() : Ok(med);
    }

    //POST /api/medications
    [HttpPost]
    public async Task<IActionResult> Create(CreateMedicationDto dto) {

        var med = await this.svc.CreateAsync(UserId, dto);
        return CreatedAtAction(nameof(GetById), new { id = med.Id }, med);
    }

    //PUT /api/medications/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UpdateMedicationDto dto) {

        var med = await this.svc.UpdateAsync(id, UserId, dto);
        return med == null ? NotFound() : Ok(med);
    }

    //DELETE /api/medications/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id) {

        var ok = await this.svc.DeleteAsync(id, UserId);
        return ok ? NoContent() : NotFound();
    }

    //PATCH /api/medications/{id}/decrease-stock
    [HttpPatch("{id}/decrease-stock")]
    public async Task<IActionResult> DecreaseStock(int id) {

        var ok = await this.svc.DecreaseStockAsync(id, UserId);
        return ok ? NoContent() : NotFound();
    }
}