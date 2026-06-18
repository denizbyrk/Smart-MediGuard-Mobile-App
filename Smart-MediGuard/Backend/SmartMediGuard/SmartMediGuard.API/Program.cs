using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartMediGuard.API.Data;
using SmartMediGuard.API.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

//cors
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

//PostgreSQL
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

//services
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<MedicationService>();
builder.Services.AddScoped<DoseHistoryService>();
builder.Services.AddScoped<SyncService>();

//JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => {
        options.TokenValidationParameters = new TokenValidationParameters {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)
            )
        };
    });

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpClient();

var app = builder.Build();

//auto migration
using (var scope = app.Services.CreateScope()) {

    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    db.Database.ExecuteSqlRaw(@"
        ALTER TABLE medications  ADD COLUMN IF NOT EXISTS client_id INTEGER;
        ALTER TABLE dose_history ADD COLUMN IF NOT EXISTS client_id INTEGER;
        ALTER TABLE reminders    ADD COLUMN IF NOT EXISTS client_id INTEGER;
        CREATE INDEX IF NOT EXISTS ix_med_client      ON medications(client_id, user_id);
        CREATE INDEX IF NOT EXISTS ix_dose_client     ON dose_history(client_id);
        CREATE INDEX IF NOT EXISTS ix_reminder_client ON reminders(client_id);
    ");
}

if (app.Environment.IsDevelopment()) {

    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();