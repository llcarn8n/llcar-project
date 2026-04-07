using System.Collections.ObjectModel;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Graphics;

namespace llcar.Models
{
    /// <summary>
    /// Drawable для отрисовки area chart (график с заполнением снизу)
    /// </summary>
    public partial class AreaChartDrawable : BindableObject, IDrawable
    {
        public static readonly BindableProperty DataProperty = BindableProperty.Create(
            nameof(Data), 
            typeof(ObservableCollection<HistogramDataPoint>), 
            typeof(AreaChartDrawable), 
            new ObservableCollection<HistogramDataPoint>(),
            propertyChanged: OnDataChanged);

        public ObservableCollection<HistogramDataPoint> Data
        {
            get => (ObservableCollection<HistogramDataPoint>)GetValue(DataProperty);
            set => SetValue(DataProperty, value);
        }

        public static readonly BindableProperty BarColorProperty = BindableProperty.Create(
            nameof(BarColor), 
            typeof(string), 
            typeof(AreaChartDrawable), 
            "#0A84FF",
            propertyChanged: OnDataChanged);

        public string BarColor
        {
            get => (string)GetValue(BarColorProperty);
            set => SetValue(BarColorProperty, value);
        }

        public static readonly BindableProperty PercentileProperty = BindableProperty.Create(
            nameof(Percentile), 
            typeof(double), 
            typeof(AreaChartDrawable), 
            95.0,
            propertyChanged: OnDataChanged);

        public double Percentile
        {
            get => (double)GetValue(PercentileProperty);
            set => SetValue(PercentileProperty, value);
        }

        private static void OnDataChanged(BindableObject bindable, object oldValue, object newValue)
        {
            if (bindable is AreaChartDrawable drawable)
            {
                drawable.Invalidate();
            }
        }

        public void Invalidate()
        {
            // Вызывается для перерисовки
        }

        public void Draw(ICanvas canvas, RectF dirtyRect)
        {
            if (Data == null || Data.Count == 0)
            {
                // Пустой график - заливаем фон
                canvas.FillColor = Color.FromArgb("#0A0A0A");
                canvas.FillRectangle(dirtyRect);
                return;
            }

            // Заливаем фон
            canvas.FillColor = Color.FromArgb("#0A0A0A");
            canvas.FillRectangle(dirtyRect);

            var points = Data.Select(d => d.Value).ToArray();
            if (points.Length == 0) return;

            // Вычисляем границы с учетом перцентиля
            var sortedPoints = points.OrderBy(p => p).ToArray();
            var percentileIndex = (int)(sortedPoints.Length * (Percentile / 100.0));
            if (percentileIndex >= sortedPoints.Length) percentileIndex = sortedPoints.Length - 1;
            if (percentileIndex < 0) percentileIndex = 0;
            
            var maxValue = sortedPoints[percentileIndex];
            var minValue = sortedPoints[0];
            var range = maxValue - minValue;
            if (range == 0) range = 1; // Защита от деления на ноль

            var width = dirtyRect.Width;
            var height = dirtyRect.Height;
            var stepX = width / (points.Length - 1);

            // Строим path для заполнения
            var fillPath = new PathF();
            fillPath.MoveTo(0, height); // Начинаем с нижнего левого угла

            // Верхняя линия графика
            for (int i = 0; i < points.Length; i++)
            {
                var x = i * stepX;
                var normalizedY = 1.0 - ((points[i] - minValue) / range);
                // Ограничиваем значения в пределах [0, 1]
                normalizedY = Math.Max(0, Math.Min(1, normalizedY));
                var y = (float)(normalizedY * height);
                fillPath.LineTo(x, y);
            }

            // Замыкаем path внизу справа и внизу слева
            fillPath.LineTo(width, height);
            fillPath.LineTo(0, height);
            fillPath.Close();

            // Заполняем цветом с прозрачностью 15%
            var fillColor = Color.FromArgb(BarColor);
            canvas.FillColor = fillColor.WithAlpha(0.15f);
            canvas.FillPath(fillPath);

            // Рисуем линию графика сверху
            var linePath = new PathF();
            for (int i = 0; i < points.Length; i++)
            {
                var x = i * stepX;
                var normalizedY = 1.0 - ((points[i] - minValue) / range);
                normalizedY = Math.Max(0, Math.Min(1, normalizedY));
                var y = (float)(normalizedY * height);
                
                if (i == 0)
                    linePath.MoveTo(x, y);
                else
                    linePath.LineTo(x, y);
            }

            canvas.StrokeColor = fillColor;
            canvas.StrokeSize = 2;
            canvas.DrawPath(linePath);
        }
    }
}
