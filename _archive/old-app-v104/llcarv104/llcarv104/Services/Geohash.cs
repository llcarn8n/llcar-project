namespace llcar.Services;

/// <summary>
/// Geohash encoding utility
/// </summary>
public static class Geohash
{
    private const string Base32 = "0123456789bcdefghjkmnpqrstuvwxyz";
    
    /// <summary>
    /// Encodes latitude and longitude to geohash string
    /// </summary>
    public static string Encode(double latitude, double longitude, int precision = 8)
    {
        double latMin = -90, latMax = 90;
        double lonMin = -180, lonMax = 180;
        
        var result = new char[precision];
        int bit = 0;
        int ch = 0;
        int resultIndex = 0;
        bool evenBit = true;
        
        while (resultIndex < precision)
        {
            if (evenBit)
            {
                // Longitude
                var lonMid = (lonMin + lonMax) / 2;
                if (longitude >= lonMid)
                {
                    ch = (ch << 1) | 1;
                    lonMin = lonMid;
                }
                else
                {
                    ch = ch << 1;
                    lonMax = lonMid;
                }
            }
            else
            {
                // Latitude
                var latMid = (latMin + latMax) / 2;
                if (latitude >= latMid)
                {
                    ch = (ch << 1) | 1;
                    latMin = latMid;
                }
                else
                {
                    ch = ch << 1;
                    latMax = latMid;
                }
            }
            
            evenBit = !evenBit;
            bit++;
            
            if (bit == 5)
            {
                result[resultIndex] = Base32[ch];
                resultIndex++;
                bit = 0;
                ch = 0;
            }
        }
        
        return new string(result);
    }
}
