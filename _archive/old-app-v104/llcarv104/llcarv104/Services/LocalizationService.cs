using System.Globalization;

namespace llcar.Services;

public interface ILocalizationService
{
    string this[string key] { get; }
    CultureInfo CurrentCulture { get; }
    IReadOnlyList<CultureInfo> SupportedCultures { get; }
    event EventHandler? CultureChanged;
    void SetCulture(string cultureCode);
    void SetCulture(CultureInfo culture);
}

public class LocalizationService : ILocalizationService
{
    private CultureInfo _currentCulture = new("en");
    
    public IReadOnlyList<CultureInfo> SupportedCultures { get; } = new List<CultureInfo>
    {
        new("en"),    // English
        new("ru"),    // Russian
        new("es"),    // Spanish
        new("zh"),    // Chinese
        new("ar")     // Arabic
    }.AsReadOnly();

    public CultureInfo CurrentCulture => _currentCulture;

    public event EventHandler? CultureChanged;

    public string this[string key]
    {
        get
        {
            // TODO: Implement proper resource lookup when Resources.Strings is generated
            // For now, return the key as-is
            return key;
        }
    }

    public void SetCulture(string cultureCode)
    {
        var culture = SupportedCultures.FirstOrDefault(c => 
            c.Name.Equals(cultureCode, StringComparison.OrdinalIgnoreCase) ||
            c.TwoLetterISOLanguageName.Equals(cultureCode, StringComparison.OrdinalIgnoreCase));
        
        if (culture != null)
        {
            SetCulture(culture);
        }
    }

    public void SetCulture(CultureInfo culture)
    {
        if (SupportedCultures.Any(c => c.Name == culture.Name || c.TwoLetterISOLanguageName == culture.TwoLetterISOLanguageName))
        {
            _currentCulture = culture;
            CultureInfo.CurrentCulture = culture;
            CultureInfo.CurrentUICulture = culture;
            CultureChanged?.Invoke(this, EventArgs.Empty);
        }
    }
}

public static class LocalizationExtensions
{
    public static string Translate(this string key)
    {
        var service = Application.Current?.Handler?.MauiContext?.Services.GetService<ILocalizationService>();
        return service?[key] ?? key;
    }
}
