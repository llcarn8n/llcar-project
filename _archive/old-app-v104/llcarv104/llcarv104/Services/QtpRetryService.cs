using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using llcar.Data;
using llcar.Models.QtpCompression;

namespace llcar.Services;

/// <summary>
/// Service for handling QTP packet retries via database storage
/// </summary>
public interface IQtpRetryService
{
    /// <summary>
    /// Stores failed QTP packet for retry
    /// </summary>
    Task StoreFailedPacketAsync(QtpPacket packet);
    
    /// <summary>
    /// Gets all failed packets for retry
    /// </summary>
    Task<List<(long Id, QtpPacket Packet)>> GetFailedPacketsAsync(int limit = 50);
    
    /// <summary>
    /// Marks packet as sent successfully
    /// </summary>
    Task MarkAsSentAsync(long packetId);
    
    /// <summary>
    /// Gets count of failed packets
    /// </summary>
    Task<int> GetFailedCountAsync();
    
    /// <summary>
    /// Cleans up old sent packets (older than 7 days)
    /// </summary>
    Task CleanupOldPacketsAsync();
}

/// <summary>
/// Implementation of QTP retry service using NormalizedVehicleDataRepository
/// </summary>
public class QtpRetryService : IQtpRetryService
{
    private readonly NormalizedVehicleDataRepository _repository;
    private const int MaxRetryCount = 5;
    private const int CleanupDays = 7;
    
    public QtpRetryService(NormalizedVehicleDataRepository repository)
    {
        _repository = repository;
    }
    
    public async Task StoreFailedPacketAsync(QtpPacket packet)
    {
        try
        {
            var id = await _repository.StorePacketAsync(packet, "Upload failed");
            
            Log.Debug($"[QTP_RETRY] Stored failed packet: {id}");
        }
        catch (Exception ex)
        {
            Log.Debug($"[QTP_RETRY] Error storing packet: {ex.Message}");
        }
    }
    
    public async Task<List<(long Id, QtpPacket Packet)>> GetFailedPacketsAsync(int limit = 50)
    {
        try
        {
            return await _repository.GetPendingPacketsWithIdsAsync(limit);
        }
        catch (Exception ex)
        {
            Log.Debug($"[QTP_RETRY] Error getting failed packets: {ex.Message}");
            return new List<(long Id, QtpPacket Packet)>();
        }
    }
    
    public async Task MarkAsSentAsync(long packetId)
    {
        try
        {
            await _repository.MarkAsSentAsync(packetId);
            Log.Debug($"[QTP_RETRY] Marked packet as sent: {packetId}");
        }
        catch (Exception ex)
        {
            Log.Debug($"[QTP_RETRY] Error marking as sent: {ex.Message}");
        }
    }

    public async Task<int> GetFailedCountAsync()
    {
        try
        {
            return await _repository.GetPendingCountAsync();
        }
        catch
        {
            return 0;
        }
    }

    public async Task CleanupOldPacketsAsync()
    {
        try
        {
            var deleted = await _repository.CleanupOldPacketsAsync(CleanupDays);
            Log.Debug($"[QTP_RETRY] Cleaned up {deleted} old packets");
        }
        catch (Exception ex)
        {
            Log.Debug($"[QTP_RETRY] Error cleaning up: {ex.Message}");
        }
    }
}
