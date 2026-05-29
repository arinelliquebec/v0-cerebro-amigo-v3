using ApiGateway.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiGateway.Data;

/// <summary>
/// EF Core 10 DbContext.
/// Mapeia as tabelas que o Go orchestrator também usa.
/// O Go é o "owner" das writes principais; este context é majoritariamente leitura
/// + writes de pagamento/NF que ficam no domínio do .NET.
/// </summary>
public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Conversa> Conversas => Set<Conversa>();
    public DbSet<Mensagem> Mensagens => Set<Mensagem>();
    public DbSet<Agente> Agentes => Set<Agente>();
    public DbSet<Pagamento> Pagamentos => Set<Pagamento>();
    public DbSet<NotaFiscal> NotasFiscais => Set<NotaFiscal>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cliente>(b =>
        {
            b.ToTable("clientes");
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.WaId).IsUnique();
            // EF Core 10: JSONB nativo do Postgres
            b.Property(x => x.Contexto).HasColumnType("jsonb");
        });

        modelBuilder.Entity<Conversa>(b =>
        {
            b.ToTable("conversas");
            b.HasKey(x => x.Id);
            b.HasOne<Cliente>().WithMany().HasForeignKey(x => x.ClienteId);
            b.HasIndex(x => new { x.ClienteId, x.CriadaEm });
        });

        modelBuilder.Entity<Mensagem>(b =>
        {
            b.ToTable("mensagens");
            b.HasKey(x => x.Id);
            b.HasOne<Conversa>().WithMany().HasForeignKey(x => x.ConversaId);
            b.HasIndex(x => new { x.ConversaId, x.CriadaEm });
        });

        modelBuilder.Entity<Agente>(b =>
        {
            b.ToTable("agentes");
            b.HasKey(x => x.Id);
        });

        modelBuilder.Entity<Pagamento>(b =>
        {
            b.ToTable("pagamentos");
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.MercadoPagoId).IsUnique();
        });

        modelBuilder.Entity<NotaFiscal>(b =>
        {
            b.ToTable("notas_fiscais");
            b.HasKey(x => x.Id);
            b.HasOne<Pagamento>().WithMany().HasForeignKey(x => x.PagamentoId);
        });

        modelBuilder.Entity<Usuario>(b =>
        {
            b.ToTable("usuarios");
            b.HasKey(x => x.Id);
            b.HasIndex(x => x.Email).IsUnique();
        });
    }
}
