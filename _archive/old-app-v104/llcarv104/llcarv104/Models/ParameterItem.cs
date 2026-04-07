using CommunityToolkit.Mvvm.ComponentModel;
using System.Collections.ObjectModel;

namespace llcar.Models
{
    /// <summary>
    /// Элемент параметра для таблицы (OBD2, Акселерометр, Звук)
    /// </summary>
    public partial class ParameterItem : ObservableObject
    {
        [ObservableProperty]
        private string _id = "";
        
        [ObservableProperty]
        private string _name = "";
        
        [ObservableProperty]
        private string _value = "--";
        
        [ObservableProperty]
        private bool _showGraph;
        
        [ObservableProperty]
        private string _unit = "";
        
        [ObservableProperty]
        private string _dataType = "";
        
        [ObservableProperty]
        private string _section = "";
    }
    
    /// <summary>
    /// Конфигурация гистограммы для параметра
    /// </summary>
    public partial class HistogramConfig : ObservableObject
    {
        [ObservableProperty]
        private string _parameterId = "";
        
        [ObservableProperty]
        private string _parameterName = "";
        
        [ObservableProperty]
        private string _dataType = "";
        
        [ObservableProperty]
        private Color _barColor = Colors.Blue;
        
        [ObservableProperty]
        private int _position = 0;
        
        [ObservableProperty]
        private ObservableCollection<HistogramDataPoint> _data = new();
        
        [ObservableProperty]
        private string _minValue = "";
        
        [ObservableProperty]
        private string _maxValue = "";
        
        [ObservableProperty]
        private string _avgValue = "";
        
        [ObservableProperty]
        private AreaChartDrawable _areaChartDrawable = new();
        
        [ObservableProperty]
        private DateTime _lastUpdateTime = DateTime.MinValue;
        
        [ObservableProperty]
        private bool _isCompare;
        
        [ObservableProperty]
        private string _originalParameterId = "";
        
        [ObservableProperty]
        private string _ecuAddresses = "";
    }
}
