using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartMediGuard.API.DTOs;
using SmartMediGuard.API.Services;
using System.Security.Claims;

namespace SmartMediGuard.API.Controllers;

[ApiController]
[Route("api/sync")]
[Authorize]
public class SyncController : ControllerBase {

    private readonly SyncService svc;

    public SyncController(SyncService svc) => this.svc = svc;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    //POST /api/sync
    [HttpPost]
    public async Task<IActionResult> Sync(SyncRequestDto dto)
        => Ok(await this.svc.SyncAsync(UserId, dto));
}