using CommunityToolkit.Mvvm.ComponentModel;

namespace llcar.Models
{
    /// <summary>
    /// Компонент автомобиля в SVG с координатами и привязкой к Knowledge Base
    /// </summary>
    public partial class VehicleSvgComponent : ObservableObject
    {
        [ObservableProperty]
        private string _id = ""; // ID прямоугольника (например: "battery", "engine", etc.)

        [ObservableProperty]
        private string _name = ""; // Отображаемое имя

        [ObservableProperty]
        private string _knowledgeBaseSection = ""; // Ссылка на раздел в Knowledge Base

        [ObservableProperty]
        private double _x; // Координата X в SVG

        [ObservableProperty]
        private double _y; // Координата Y в SVG

        [ObservableProperty]
        private double _width; // Ширина прямоугольника

        [ObservableProperty]
        private double _height; // Высота прямоугольника

        [ObservableProperty]
        private bool _isSelected;

        [ObservableProperty]
        private bool _isHovered;

        // PID данные для отображения
        [ObservableProperty]
        private string _pidValue = ""; // Текущее значение PID

        [ObservableProperty]
        private string _pidUnit = ""; // Единица измерения

        [ObservableProperty]
        private double _pidNumericValue; // Числовое значение для индикации

        [ObservableProperty]
        private string _pidName = ""; // Название PID

        // Цвет индикации (норма/предупреждение/критично)
        [ObservableProperty]
        private Color _statusColor = Colors.Green;
    }

    /// <summary>
    /// Таблица соответствия компонентов и PIDов
    /// </summary>
    public static class VehicleComponentPidMapping
    {
        public static readonly Dictionary<string, List<string>> ComponentToPids = new()
        {
            // Двигатель / Engine
            ["engine"] = new() { "010C", "0105", "0106", "0107", "010E", "0111", "015C" }, // RPM, ECT, STFT, LTFT, Timing, Throttle, Oil Temp
            
            // Аккумулятор / Battery
            ["battery"] = new() { "0142", "0143", "015B" }, // Control Module Voltage, Load Value, Hybrid Battery Pack
            
            // Катушки / Ignition
            ["ignition"] = new() { "010E", "0110" }, // Timing Advance, MAF Rate
            
            // Охлаждение / Cooling
            ["cooling"] = new() { "0105", "0167", "0168" }, // ECT, ECT Sensor 2, IAT Sensor
            
            // Топливная система / Fuel
            ["fuel"] = new() { "012F", "0132", "013C", "013D", "0121", "0122" }, // Fuel Level, Fuel Rail Pressure, O2 Sensor, Odometer, Distance
            
            // Трансмиссия / Transmission
            ["transmission"] = new() { "0151", "0152", "0153", "0154", "0155", "0156" }, // Drive Type, Gear, Torque Converter, etc.
            
            // Электродвигатель (передний) / Front Motor
            ["front_motor"] = new() { "015A", "015B", "016F", "0170" }, // Battery Voltage, Current, Temperature, etc.
            
            // Электродвигатель (задний) / Rear Motor
            ["rear_motor"] = new() { "015A", "015B", "016F", "0170" }, // Battery Voltage, Current, Temperature, etc.
            
            // HV Distribution Unit
            ["hv_distribution"] = new() { "0142", "015A", "015C" }, // Voltage, Current, Temperature
            
            // On-board Charger
            ["obc"] = new() { "0142", "015A", "015B" }, // Voltage, Current
            
            // Подвеска / Suspension
            ["suspension"] = new() { "0133", "0134" }, // Barometric Pressure (для адаптивной подвески)
            
            // Тормоза / Brakes
            ["brakes"] = new() { "0147", "0148" }, // Brake Pressure, Brake Pedal Position
            
            // Рулевое / Steering
            ["steering"] = new() { "0173", "0174" }, // Steering Angle, etc.
            
            // Колеса / Wheels
            ["wheels"] = new() { "0154", "0155" }, // Wheel Speed Sensors
            
            // Климат / HVAC
            ["hvac"] = new() { "0146", "0167" }, // Ambient Air Temperature
            
            // Генератор / Generator
            ["generator"] = new() { "0142", "0143" }, // Voltage, Load
        };

        public static readonly Dictionary<string, string> ComponentToKnowledgeBaseSection = new()
        {
            ["engine"] = "#engine",
            ["battery"] = "#battery_pack",
            ["ignition"] = "#ignition_system",
            ["cooling"] = "#cooling_system",
            ["fuel"] = "#fuel_system",
            ["transmission"] = "#transmission",
            ["front_motor"] = "#front_motor",
            ["rear_motor"] = "#rear_motor",
            ["hv_distribution"] = "#hv_distribution",
            ["obc"] = "#on_board_charger",
            ["charging_port"] = "#charging_port",
            ["suspension"] = "#suspension",
            ["brakes"] = "#brake_system",
            ["steering"] = "#steering_system",
            ["front_wheels"] = "#wheels",
            ["rear_wheels"] = "#wheels",
            ["wheels"] = "#wheels",
            ["hvac"] = "#hvac",
            ["generator"] = "#generator",
        };

        /// <summary>
        /// Получить координаты компонентов в SVG (относительно viewBox 1000x600)
        /// </summary>
        public static List<VehicleSvgComponent> GetDefaultComponents()
        {
            return new()
            {
                // Двигатель / Range Extender (спереди слева)
                new()
                {
                    Id = "engine",
                    Name = "Engine",
                    X = 40, Y = 220, Width = 80, Height = 60,
                    KnowledgeBaseSection = "#engine",
                    PidName = "RPM",
                    PidUnit = "rpm"
                },
                // Передний электромотор
                new()
                {
                    Id = "front_motor",
                    Name = "Front Motor",
                    X = 160, Y = 240, Width = 70, Height = 50,
                    KnowledgeBaseSection = "#front_motor",
                    PidName = "Voltage",
                    PidUnit = "V"
                },
                // Аккумуляторная батарея (в центре снизу)
                new()
                {
                    Id = "battery",
                    Name = "Battery Pack",
                    X = 220, Y = 300, Width = 240, Height = 60,
                    KnowledgeBaseSection = "#battery_pack",
                    PidName = "SOC",
                    PidUnit = "%"
                },
                // Топливный бак
                new()
                {
                    Id = "fuel",
                    Name = "Fuel Tank",
                    X = 340, Y = 260, Width = 100, Height = 40,
                    KnowledgeBaseSection = "#fuel_system",
                    PidName = "Fuel Level",
                    PidUnit = "%"
                },
                // Задний электромотор
                new()
                {
                    Id = "rear_motor",
                    Name = "Rear Motor",
                    X = 510, Y = 250, Width = 80, Height = 60,
                    KnowledgeBaseSection = "#rear_motor",
                    PidName = "Voltage",
                    PidUnit = "V"
                },
                // HV Distribution Unit
                new()
                {
                    Id = "hv_distribution",
                    Name = "HV Unit",
                    X = 620, Y = 230, Width = 60, Height = 50,
                    KnowledgeBaseSection = "#hv_distribution",
                    PidName = "Voltage",
                    PidUnit = "V"
                },
                // On-board Charger
                new()
                {
                    Id = "obc",
                    Name = "OBC",
                    X = 480, Y = 210, Width = 50, Height = 40,
                    KnowledgeBaseSection = "#on_board_charger",
                    PidName = "Current",
                    PidUnit = "A"
                },
                // Передние колеса
                new()
                {
                    Id = "front_wheels",
                    Name = "Front Wheels",
                    X = 80, Y = 330, Width = 100, Height = 40,
                    KnowledgeBaseSection = "#wheels",
                    PidName = "Speed",
                    PidUnit = "km/h"
                },
                // Задние колеса
                new()
                {
                    Id = "rear_wheels",
                    Name = "Rear Wheels",
                    X = 480, Y = 340, Width = 100, Height = 40,
                    KnowledgeBaseSection = "#wheels",
                    PidName = "Speed",
                    PidUnit = "km/h"
                },
                // Кабина (для спектрограммы шума)
                new()
                {
                    Id = "cabin",
                    Name = "Cabin",
                    X = 280, Y = 140, Width = 160, Height = 100,
                    KnowledgeBaseSection = "#interior",
                    PidName = "Noise",
                    PidUnit = "dB"
                },
                // Подвеска / Амортизаторы
                new()
                {
                    Id = "suspension",
                    Name = "Suspension",
                    X = 150, Y = 320, Width = 60, Height = 40,
                    KnowledgeBaseSection = "#suspension",
                    PidName = "Vibration",
                    PidUnit = "g"
                },
                // Охлаждение
                new()
                {
                    Id = "cooling",
                    Name = "Cooling",
                    X = 40, Y = 180, Width = 60, Height = 40,
                    KnowledgeBaseSection = "#cooling_system",
                    PidName = "Temp",
                    PidUnit = "°C"
                },
                // Генератор
                new()
                {
                    Id = "generator",
                    Name = "Generator",
                    X = 120, Y = 190, Width = 50, Height = 40,
                    KnowledgeBaseSection = "#generator",
                    PidName = "Voltage",
                    PidUnit = "V"
                }
            };
        }
    }
}
