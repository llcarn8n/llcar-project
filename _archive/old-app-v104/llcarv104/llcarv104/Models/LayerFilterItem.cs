using CommunityToolkit.Mvvm.ComponentModel;

namespace llcar.Models
{
    public partial class LayerFilterItem : ObservableObject
    {
        [ObservableProperty]
        private string _layerKey = string.Empty;

        [ObservableProperty]
        private string _displayName = string.Empty;

        [ObservableProperty]
        private bool _isSelected;

        [ObservableProperty]
        private bool _isVisible = true;

        [ObservableProperty]
        private bool _isSemiTransparent;
    }
}