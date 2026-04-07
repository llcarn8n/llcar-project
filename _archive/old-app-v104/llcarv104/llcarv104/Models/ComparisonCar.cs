using CommunityToolkit.Mvvm.ComponentModel;

namespace llcar.Models
{
    /// <summary>
    /// Represents a car for comparison in the radar chart
    /// </summary>
    public partial class ComparisonCar : ObservableObject
    {
        [ObservableProperty]
        private string _brand = "";

        [ObservableProperty]
        private string _model = "";

        [ObservableProperty]
        private string _generation = "";

        [ObservableProperty]
        private string _equipment = "";

        [ObservableProperty]
        private double _gasRating;

        [ObservableProperty]
        private double _brakeRating;

        [ObservableProperty]
        private double _steeringRating;

        [ObservableProperty]
        private double _noiseRating;

        [ObservableProperty]
        private double _comfortRating;

        [ObservableProperty]
        private Color _color = Colors.Blue;

        public string DisplayName => $"{Brand} {Model}";

        /// <summary>
        /// Gets all ratings as an array for the radar chart
        /// </summary>
        public double[] GetRatings() => new[] { GasRating, BrakeRating, SteeringRating, NoiseRating, ComfortRating };
    }

    /// <summary>
    /// Data point for histogram visualization
    /// </summary>
    public partial class HistogramDataPoint : ObservableObject
    {
        [ObservableProperty]
        private int _index;

        [ObservableProperty]
        private DateTime _timestamp;

        [ObservableProperty]
        private string _parameterName = "";

        [ObservableProperty]
        private string _parameter = "";

        [ObservableProperty]
        private double _value;
        
        [ObservableProperty]
        private string _unit = "";
        
        [ObservableProperty]
        private string? _extendedData;
        
        [ObservableProperty]
        private double _normalizedHeight;
        
        [ObservableProperty]
        private string _timeLabel = "";
        
        [ObservableProperty]
        private string _dateLabel = "";
        
        [ObservableProperty]
        private string _barColor = "#0A84FF";
        
        [ObservableProperty]
        private double _minValue;
        
        [ObservableProperty]
        private double _avgValue;
        
        [ObservableProperty]
        private double _maxValue;
        
        [ObservableProperty]
        private DateTime _histogramStartTime;

        [ObservableProperty]
        private DateTime _histogramEndTime;

        [ObservableProperty]
        private string _ecuAddresses = "";
    }

    /// <summary>
    /// Drawable for rendering the radar chart comparison
    /// </summary>
    public partial class RadarChartDrawable : ObservableObject, IDrawable
    {
        [ObservableProperty]
        private List<ComparisonCar> _cars = new();

        private readonly string[] _labels = { "Gas", "Brake", "Steering", "Noise", "Comfort" };

        public void Draw(ICanvas canvas, RectF dirtyRect)
        {
            if (Cars.Count == 0)
            {
                DrawEmptyState(canvas, dirtyRect);
                return;
            }

            var centerX = dirtyRect.Center.X;
            var centerY = dirtyRect.Center.Y;
            var radius = Math.Min(dirtyRect.Width, dirtyRect.Height) / 2 - 40;

            // Draw grid circles
            DrawGrid(canvas, centerX, centerY, radius);

            // Draw axes and labels
            DrawAxes(canvas, centerX, centerY, radius);

            // Draw car data polygons
            foreach (var car in Cars)
            {
                DrawCarPolygon(canvas, car, centerX, centerY, radius);
            }
        }

        private void DrawGrid(ICanvas canvas, float centerX, float centerY, float radius)
        {
            canvas.StrokeColor = Application.Current?.RequestedTheme == AppTheme.Dark 
                ? Colors.Gray.WithAlpha(0.5f) 
                : Colors.Gray.WithAlpha(0.3f);
            canvas.StrokeSize = 1;
            canvas.StrokeDashPattern = new[] { 5f, 5f };

            for (int i = 1; i <= 5; i++)
            {
                var r = radius * i / 5;
                canvas.DrawCircle(centerX, centerY, r);
            }

            canvas.StrokeDashPattern = null;
        }

        private void DrawAxes(ICanvas canvas, float centerX, float centerY, float radius)
        {
            var angleStep = 2 * Math.PI / 5;
            var labelColor = Application.Current?.RequestedTheme == AppTheme.Dark 
                ? Colors.White 
                : Colors.Black;

            for (int i = 0; i < 5; i++)
            {
                var angle = i * angleStep - Math.PI / 2;
                var x = centerX + radius * Math.Cos(angle);
                var y = centerY + radius * Math.Sin(angle);

                canvas.StrokeColor = Application.Current?.RequestedTheme == AppTheme.Dark 
                    ? Colors.Gray.WithAlpha(0.5f) 
                    : Colors.Gray.WithAlpha(0.3f);
                canvas.DrawLine(centerX, centerY, (float)x, (float)y);

                // Draw label
                var labelX = centerX + (radius + 25) * Math.Cos(angle);
                var labelY = centerY + (radius + 25) * Math.Sin(angle);

                canvas.FontColor = labelColor;
                canvas.FontSize = 11;
                canvas.Font = Microsoft.Maui.Graphics.Font.DefaultBold;

                var textWidth = 60;
                var textHeight = 20;
                
                canvas.DrawString(_labels[i], (float)labelX - textWidth / 2, (float)labelY - textHeight / 2, 
                    textWidth, textHeight, HorizontalAlignment.Center, VerticalAlignment.Center);
            }
        }

        private void DrawCarPolygon(ICanvas canvas, ComparisonCar car, float centerX, float centerY, float radius)
        {
            var ratings = car.GetRatings();
            var angleStep = 2 * Math.PI / 5;
            var path = new PathF();

            for (int i = 0; i < 5; i++)
            {
                var angle = i * angleStep - Math.PI / 2;
                var normalizedRating = Math.Clamp(ratings[i], 0, 100) / 100;
                var r = radius * normalizedRating;
                var x = centerX + r * Math.Cos(angle);
                var y = centerY + r * Math.Sin(angle);

                if (i == 0)
                    path.MoveTo((float)x, (float)y);
                else
                    path.LineTo((float)x, (float)y);
            }
            path.Close();

            // Fill polygon
            canvas.FillColor = car.Color.WithAlpha(0.25f);
            canvas.FillPath(path);

            // Draw polygon outline
            canvas.StrokeColor = car.Color;
            canvas.StrokeSize = 2;
            canvas.DrawPath(path);

            // Draw data points
            for (int i = 0; i < 5; i++)
            {
                var angle = i * angleStep - Math.PI / 2;
                var normalizedRating = Math.Clamp(ratings[i], 0, 100) / 100;
                var r = radius * normalizedRating;
                var x = centerX + r * Math.Cos(angle);
                var y = centerY + r * Math.Sin(angle);

                canvas.FillColor = car.Color;
                canvas.FillCircle((float)x, (float)y, 5);

                // Draw white border for visibility
                canvas.StrokeColor = Colors.White;
                canvas.StrokeSize = 1;
                canvas.DrawCircle((float)x, (float)y, 5);
            }
        }

        private void DrawEmptyState(ICanvas canvas, RectF dirtyRect)
        {
            var textColor = Application.Current?.RequestedTheme == AppTheme.Dark 
                ? Colors.LightGray 
                : Colors.Gray;

            canvas.FontColor = textColor;
            canvas.FontSize = 14;
            canvas.DrawString("Select cars to compare", dirtyRect.Center.X - 75, dirtyRect.Center.Y - 10,
                150, 20, HorizontalAlignment.Center, VerticalAlignment.Center);
        }

        public void RequestRepaint()
        {
            OnPropertyChanged(nameof(Cars));
        }
    }
}
