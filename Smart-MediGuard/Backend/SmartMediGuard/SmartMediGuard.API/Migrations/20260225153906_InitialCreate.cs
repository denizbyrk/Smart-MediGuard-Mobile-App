using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SmartMediGuard.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    age = table.Column<int>(type: "integer", nullable: true),
                    health_conditions = table.Column<string>(type: "jsonb", nullable: true),
                    emergency_contact = table.Column<string>(type: "jsonb", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "medications",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    dosage = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    frequency = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    time_slots = table.Column<string>(type: "jsonb", nullable: true),
                    stock_count = table.Column<int>(type: "integer", nullable: false),
                    stock_warning_threshold = table.Column<int>(type: "integer", nullable: false),
                    instructions = table.Column<string>(type: "text", nullable: true),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    color_code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_medications", x => x.id);
                    table.ForeignKey(
                        name: "FK_medications_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "prescription_scans",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    image_url = table.Column<string>(type: "text", nullable: true),
                    extracted_data = table.Column<string>(type: "jsonb", nullable: true),
                    is_confirmed = table.Column<bool>(type: "boolean", nullable: false),
                    scanned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_prescription_scans", x => x.id);
                    table.ForeignKey(
                        name: "FK_prescription_scans_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "sync_log",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    table_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    record_id = table.Column<int>(type: "integer", nullable: false),
                    action = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    synced_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_sync_log", x => x.id);
                    table.ForeignKey(
                        name: "FK_sync_log_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "dose_history",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    medication_id = table.Column<int>(type: "integer", nullable: false),
                    scheduled_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    taken_time = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    status = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "pending"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_dose_history", x => x.id);
                    table.ForeignKey(
                        name: "FK_dose_history_medications_medication_id",
                        column: x => x.medication_id,
                        principalTable: "medications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "drug_interactions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    medication_1_id = table.Column<int>(type: "integer", nullable: true),
                    medication_2_id = table.Column<int>(type: "integer", nullable: true),
                    severity = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    checked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_drug_interactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_drug_interactions_medications_medication_1_id",
                        column: x => x.medication_1_id,
                        principalTable: "medications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_drug_interactions_medications_medication_2_id",
                        column: x => x.medication_2_id,
                        principalTable: "medications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_drug_interactions_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "reminders",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    medication_id = table.Column<int>(type: "integer", nullable: false),
                    reminder_time = table.Column<TimeOnly>(type: "time without time zone", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    snooze_minutes = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reminders", x => x.id);
                    table.ForeignKey(
                        name: "FK_reminders_medications_medication_id",
                        column: x => x.medication_id,
                        principalTable: "medications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_dose_history_medication_id",
                table: "dose_history",
                column: "medication_id");

            migrationBuilder.CreateIndex(
                name: "IX_drug_interactions_medication_1_id",
                table: "drug_interactions",
                column: "medication_1_id");

            migrationBuilder.CreateIndex(
                name: "IX_drug_interactions_medication_2_id",
                table: "drug_interactions",
                column: "medication_2_id");

            migrationBuilder.CreateIndex(
                name: "IX_drug_interactions_user_id",
                table: "drug_interactions",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_medications_user_id",
                table: "medications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_prescription_scans_user_id",
                table: "prescription_scans",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_reminders_medication_id",
                table: "reminders",
                column: "medication_id");

            migrationBuilder.CreateIndex(
                name: "IX_sync_log_user_id",
                table: "sync_log",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "dose_history");

            migrationBuilder.DropTable(
                name: "drug_interactions");

            migrationBuilder.DropTable(
                name: "prescription_scans");

            migrationBuilder.DropTable(
                name: "reminders");

            migrationBuilder.DropTable(
                name: "sync_log");

            migrationBuilder.DropTable(
                name: "medications");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
