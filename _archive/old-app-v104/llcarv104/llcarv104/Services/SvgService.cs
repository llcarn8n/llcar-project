using System.Xml.Linq;
using Microsoft.Maui.Graphics;

namespace llcar.Services
{
    /// <summary>
    /// Сервис для загрузки и парсинга SVG файлов
    /// </summary>
    public interface ISvgService
    {
        /// <summary>
        /// Загрузить SVG из встроенных ресурсов
        /// </summary>
        Task<SvgDocument> LoadSvgAsync(string resourceName);
        
        /// <summary>
        /// Парсить SVG из строки
        /// </summary>
        SvgDocument ParseSvg(string svgContent);
        
        /// <summary>
        /// Преобразовать SVG в Drawable для GraphicsView
        /// </summary>
        IDrawable CreateDrawable(SvgDocument document);
    }
    
    /// <summary>
    /// Представление SVG документа
    /// </summary>
    public class SvgDocument
    {
        public float ViewBoxX { get; set; }
        public float ViewBoxY { get; set; }
        public float ViewBoxWidth { get; set; }
        public float ViewBoxHeight { get; set; }
        public float Width { get; set; }
        public float Height { get; set; }
        public List<SvgElement> Elements { get; } = new();
        public string RawContent { get; set; } = "";
    }
    
    /// <summary>
    /// Базовый SVG элемент
    /// </summary>
    public abstract class SvgElement
    {
        public string? Id { get; set; }
        public string? Class { get; set; }
        public Color Fill { get; set; } = Colors.Transparent;
        public Color Stroke { get; set; } = Colors.Transparent;
        public float StrokeWidth { get; set; }
        public float Opacity { get; set; } = 1f;
        public abstract void Draw(ICanvas canvas);
    }
    
    public class SvgRect : SvgElement
    {
        public float X { get; set; }
        public float Y { get; set; }
        public float Width { get; set; }
        public float Height { get; set; }
        public float Rx { get; set; }
        public float Ry { get; set; }
        
        public override void Draw(ICanvas canvas)
        {
            var rect = new RectF(X, Y, Width, Height);
            
            if (Fill != Colors.Transparent)
            {
                canvas.FillColor = Fill.WithAlpha(Opacity);
                if (Rx > 0 || Ry > 0)
                    canvas.FillRoundedRectangle(rect, Rx, Ry);
                else
                    canvas.FillRectangle(rect);
            }
            
            if (Stroke != Colors.Transparent && StrokeWidth > 0)
            {
                canvas.StrokeColor = Stroke.WithAlpha(Opacity);
                canvas.StrokeSize = StrokeWidth;
                if (Rx > 0 || Ry > 0)
                    canvas.DrawRoundedRectangle(rect, Rx, Ry);
                else
                    canvas.DrawRectangle(rect);
            }
        }
    }
    
    public class SvgCircle : SvgElement
    {
        public float Cx { get; set; }
        public float Cy { get; set; }
        public float R { get; set; }
        
        public override void Draw(ICanvas canvas)
        {
            var center = new PointF(Cx, Cy);
            
            if (Fill != Colors.Transparent)
            {
                canvas.FillColor = Fill.WithAlpha(Opacity);
                canvas.FillCircle(center, R);
            }
            
            if (Stroke != Colors.Transparent && StrokeWidth > 0)
            {
                canvas.StrokeColor = Stroke.WithAlpha(Opacity);
                canvas.StrokeSize = StrokeWidth;
                canvas.DrawCircle(center, R);
            }
        }
    }
    
    public class SvgEllipse : SvgElement
    {
        public float Cx { get; set; }
        public float Cy { get; set; }
        public float Rx { get; set; }
        public float Ry { get; set; }
        
        public override void Draw(ICanvas canvas)
        {
            var rect = new RectF(Cx - Rx, Cy - Ry, Rx * 2, Ry * 2);
            
            if (Fill != Colors.Transparent)
            {
                canvas.FillColor = Fill.WithAlpha(Opacity);
                canvas.FillEllipse(rect);
            }
            
            if (Stroke != Colors.Transparent && StrokeWidth > 0)
            {
                canvas.StrokeColor = Stroke.WithAlpha(Opacity);
                canvas.StrokeSize = StrokeWidth;
                canvas.DrawEllipse(rect);
            }
        }
    }
    
    public class SvgLine : SvgElement
    {
        public float X1 { get; set; }
        public float Y1 { get; set; }
        public float X2 { get; set; }
        public float Y2 { get; set; }
        
        public override void Draw(ICanvas canvas)
        {
            if (Stroke != Colors.Transparent)
            {
                canvas.StrokeColor = Stroke.WithAlpha(Opacity);
                canvas.StrokeSize = StrokeWidth;
                canvas.DrawLine(X1, Y1, X2, Y2);
            }
        }
    }
    
    public class SvgPath : SvgElement
    {
        public string Data { get; set; } = "";
        public PathF? Path { get; set; }
        
        public override void Draw(ICanvas canvas)
        {
            if (Path == null) return;
            
            if (Fill != Colors.Transparent)
            {
                canvas.FillColor = Fill.WithAlpha(Opacity);
                canvas.FillPath(Path);
            }
            
            if (Stroke != Colors.Transparent && StrokeWidth > 0)
            {
                canvas.StrokeColor = Stroke.WithAlpha(Opacity);
                canvas.StrokeSize = StrokeWidth;
                canvas.DrawPath(Path);
            }
        }
    }
    
    public class SvgPolygon : SvgElement
    {
        public List<PointF> Points { get; set; } = new();
        
        public override void Draw(ICanvas canvas)
        {
            if (Points.Count < 2) return;
            
            var path = new PathF();
            path.MoveTo(Points[0]);
            for (int i = 1; i < Points.Count; i++)
            {
                path.LineTo(Points[i]);
            }
            path.Close();
            
            if (Fill != Colors.Transparent)
            {
                canvas.FillColor = Fill.WithAlpha(Opacity);
                canvas.FillPath(path);
            }
            
            if (Stroke != Colors.Transparent && StrokeWidth > 0)
            {
                canvas.StrokeColor = Stroke.WithAlpha(Opacity);
                canvas.StrokeSize = StrokeWidth;
                canvas.DrawPath(path);
            }
        }
    }
    
    public class SvgGroup : SvgElement
    {
        public List<SvgElement> Children { get; set; } = new();
        public float TransformX { get; set; }
        public float TransformY { get; set; }
        
        public override void Draw(ICanvas canvas)
        {
            canvas.SaveState();
            canvas.Translate(TransformX, TransformY);
            
            foreach (var child in Children)
            {
                child.Draw(canvas);
            }
            
            canvas.RestoreState();
        }
    }
    
    /// <summary>
    /// Реализация сервиса SVG
    /// </summary>
    public class SvgService : ISvgService
    {
        public async Task<SvgDocument> LoadSvgAsync(string resourceName)
        {
            using var stream = await FileSystem.OpenAppPackageFileAsync(resourceName);
            using var reader = new StreamReader(stream);
            var content = await reader.ReadToEndAsync();
            return ParseSvg(content);
        }
        
        public SvgDocument ParseSvg(string svgContent)
        {
            var doc = new XDocument();
            try
            {
                doc = XDocument.Parse(svgContent);
            }
            catch
            {
                // Если не парсится, вернем документ с сырым контентом
                return new SvgDocument { RawContent = svgContent };
            }
            
            var svgDoc = new SvgDocument { RawContent = svgContent };
            var svgElement = doc.Root;
            
            if (svgElement == null) return svgDoc;
            
            // Парсим viewBox
            var viewBox = svgElement.Attribute("viewBox")?.Value;
            if (!string.IsNullOrEmpty(viewBox))
            {
                var parts = viewBox.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length == 4)
                {
                    svgDoc.ViewBoxX = float.Parse(parts[0]);
                    svgDoc.ViewBoxY = float.Parse(parts[1]);
                    svgDoc.ViewBoxWidth = float.Parse(parts[2]);
                    svgDoc.ViewBoxHeight = float.Parse(parts[3]);
                }
            }
            
            // Парсим width/height
            var width = svgElement.Attribute("width")?.Value;
            var height = svgElement.Attribute("height")?.Value;
            if (!string.IsNullOrEmpty(width))
                svgDoc.Width = ParseLength(width);
            if (!string.IsNullOrEmpty(height))
                svgDoc.Height = ParseLength(height);
            
            // Парсим все элементы
            foreach (var element in svgElement.Elements())
            {
                ParseElement(element, svgDoc.Elements);
            }
            
            return svgDoc;
        }
        
        private void ParseElement(XElement element, List<SvgElement> collection)
        {
            SvgElement? svgElement = null;
            
            switch (element.Name.LocalName.ToLower())
            {
                case "rect":
                    svgElement = ParseRect(element);
                    break;
                case "circle":
                    svgElement = ParseCircle(element);
                    break;
                case "ellipse":
                    svgElement = ParseEllipse(element);
                    break;
                case "line":
                    svgElement = ParseLine(element);
                    break;
                case "path":
                    svgElement = ParsePath(element);
                    break;
                case "polygon":
                    svgElement = ParsePolygon(element);
                    break;
                case "g":
                    svgElement = ParseGroup(element);
                    break;
            }
            
            if (svgElement != null)
            {
                svgElement.Id = element.Attribute("id")?.Value;
                svgElement.Class = element.Attribute("class")?.Value;
                svgElement.Fill = ParseColor(element.Attribute("fill")?.Value);
                svgElement.Stroke = ParseColor(element.Attribute("stroke")?.Value);
                svgElement.StrokeWidth = ParseLength(element.Attribute("stroke-width")?.Value ?? "0");
                svgElement.Opacity = ParseOpacity(element.Attribute("opacity")?.Value);
                
                collection.Add(svgElement);
            }
        }
        
        private SvgRect ParseRect(XElement element)
        {
            return new SvgRect
            {
                X = ParseLength(element.Attribute("x")?.Value ?? "0"),
                Y = ParseLength(element.Attribute("y")?.Value ?? "0"),
                Width = ParseLength(element.Attribute("width")?.Value ?? "0"),
                Height = ParseLength(element.Attribute("height")?.Value ?? "0"),
                Rx = ParseLength(element.Attribute("rx")?.Value ?? "0"),
                Ry = ParseLength(element.Attribute("ry")?.Value ?? "0")
            };
        }
        
        private SvgCircle ParseCircle(XElement element)
        {
            return new SvgCircle
            {
                Cx = ParseLength(element.Attribute("cx")?.Value ?? "0"),
                Cy = ParseLength(element.Attribute("cy")?.Value ?? "0"),
                R = ParseLength(element.Attribute("r")?.Value ?? "0")
            };
        }
        
        private SvgEllipse ParseEllipse(XElement element)
        {
            return new SvgEllipse
            {
                Cx = ParseLength(element.Attribute("cx")?.Value ?? "0"),
                Cy = ParseLength(element.Attribute("cy")?.Value ?? "0"),
                Rx = ParseLength(element.Attribute("rx")?.Value ?? "0"),
                Ry = ParseLength(element.Attribute("ry")?.Value ?? "0")
            };
        }
        
        private SvgLine ParseLine(XElement element)
        {
            return new SvgLine
            {
                X1 = ParseLength(element.Attribute("x1")?.Value ?? "0"),
                Y1 = ParseLength(element.Attribute("y1")?.Value ?? "0"),
                X2 = ParseLength(element.Attribute("x2")?.Value ?? "0"),
                Y2 = ParseLength(element.Attribute("y2")?.Value ?? "0")
            };
        }
        
        private SvgPath ParsePath(XElement element)
        {
            var data = element.Attribute("d")?.Value ?? "";
            return new SvgPath
            {
                Data = data,
                Path = ParsePathData(data)
            };
        }
        
        private SvgPolygon ParsePolygon(XElement element)
        {
            var pointsStr = element.Attribute("points")?.Value ?? "";
            var points = new List<PointF>();
            
            var parts = pointsStr.Split(new[] { ' ', ',' }, StringSplitOptions.RemoveEmptyEntries);
            for (int i = 0; i < parts.Length - 1; i += 2)
            {
                if (float.TryParse(parts[i], out float x) && float.TryParse(parts[i + 1], out float y))
                {
                    points.Add(new PointF(x, y));
                }
            }
            
            return new SvgPolygon { Points = points };
        }
        
        private SvgGroup ParseGroup(XElement element)
        {
            var group = new SvgGroup();
            
            // Парсим transform
            var transform = element.Attribute("transform")?.Value;
            if (!string.IsNullOrEmpty(transform))
            {
                // Простой парсинг translate(x,y)
                if (transform.StartsWith("translate("))
                {
                    var values = transform[10..].TrimEnd(')').Split(',');
                    if (values.Length >= 1)
                        group.TransformX = float.Parse(values[0].Trim());
                    if (values.Length >= 2)
                        group.TransformY = float.Parse(values[1].Trim());
                }
            }
            
            // Рекурсивно парсим детей
            foreach (var child in element.Elements())
            {
                ParseElement(child, group.Children);
            }
            
            return group;
        }
        
        private PathF ParsePathData(string data)
        {
            var path = new PathF();
            // Упрощенный парсинг path - полная реализация требует сложного парсера
            // Для базовых случаев можно использовать простую логику
            
            // TODO: Реализовать полный парсер SVG path commands (M, L, H, V, C, Q, A, Z)
            // Для сейчас вернем пустой путь
            
            return path;
        }
        
        private float ParseLength(string value)
        {
            if (string.IsNullOrEmpty(value)) return 0;
            
            value = value.Trim().ToLower();
            
            // Убираем единицы измерения
            if (value.EndsWith("px")) value = value[..^2];
            if (value.EndsWith("pt")) value = value[..^2];
            if (value.EndsWith("em")) value = value[..^2];
            if (value.EndsWith("rem")) value = value[..^3];
            if (value.EndsWith("%")) value = value[..^1];
            
            if (float.TryParse(value, System.Globalization.NumberStyles.Float,
                System.Globalization.CultureInfo.InvariantCulture, out float result))
            {
                return result;
            }
            
            return 0;
        }
        
        private Color ParseColor(string? value)
        {
            if (string.IsNullOrEmpty(value) || value == "none")
                return Colors.Transparent;
            
            try
            {
                return Color.Parse(value);
            }
            catch
            {
                return Colors.Transparent;
            }
        }
        
        private float ParseOpacity(string? value)
        {
            if (string.IsNullOrEmpty(value))
                return 1f;
            
            if (float.TryParse(value, out float result))
                return Math.Clamp(result, 0f, 1f);
            
            return 1f;
        }
        
        public IDrawable CreateDrawable(SvgDocument document)
        {
            return new SvgDrawable(document);
        }
        
        private class SvgDrawable : IDrawable
        {
            private readonly SvgDocument _document;
            
            public SvgDrawable(SvgDocument document)
            {
                _document = document;
            }
            
            public void Draw(ICanvas canvas, RectF dirtyRect)
            {
                // Вычисляем масштаб
                float scaleX = dirtyRect.Width / _document.ViewBoxWidth;
                float scaleY = dirtyRect.Height / _document.ViewBoxHeight;
                float scale = Math.Min(scaleX, scaleY);
                
                // Центрируем
                float offsetX = (dirtyRect.Width - _document.ViewBoxWidth * scale) / 2;
                float offsetY = (dirtyRect.Height - _document.ViewBoxHeight * scale) / 2;
                
                canvas.SaveState();
                canvas.Translate(offsetX, offsetY);
                canvas.Scale(scale, scale);
                
                foreach (var element in _document.Elements)
                {
                    element.Draw(canvas);
                }
                
                canvas.RestoreState();
            }
        }
    }
}
