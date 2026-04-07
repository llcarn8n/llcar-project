using System.Collections.ObjectModel;

namespace llcar.Services
{
    /// <summary>
    /// Сервис для генерации спектрограмм (шум в салоне, тряска)
    /// </summary>
    public interface ISpectrogramService
    {
        /// <summary>
        /// Получить данные спектрограммы шума (FFT анализ)
        /// </summary>
        float[] GetNoiseSpectrum(int bins = 16);
        
        /// <summary>
        /// Получить данные спектрограммы тряски с левого/правого колеса
        /// </summary>
        float[] GetVibrationSpectrum(string wheel, int bins = 8);
        
        /// <summary>
        /// Обновить все спектрограммы (вызывается по таймеру)
        /// </summary>
        void UpdateSpectrograms();
        
        /// <summary>
        /// Данные спектрограммы шума
        /// </summary>
        ReadOnlyCollection<float> NoiseSpectrum { get; }
        
        /// <summary>
        /// Данные спектрограммы тряски левого колеса
        /// </summary>
        ReadOnlyCollection<float> LeftVibrationSpectrum { get; }
        
        /// <summary>
        /// Данные спектрограммы тряски правого колеса
        /// </summary>
        ReadOnlyCollection<float> RightVibrationSpectrum { get; }
        
        /// <summary>
        /// Событие изменения спектрограмм
        /// </summary>
        event EventHandler SpectrogramsUpdated;
        
        /// <summary>
        /// Обновить параметры двигателя для расчета спектров
        /// </summary>
        void UpdateEngineParameters(float rpm, float speed);
    }
    
    /// <summary>
    /// Реализация сервиса спектрограмм с симуляцией данных
    /// </summary>
    public class SpectrogramService : ISpectrogramService
    {
        private readonly List<float> _noiseSpectrum = new();
        private readonly List<float> _leftVibrationSpectrum = new();
        private readonly List<float> _rightVibrationSpectrum = new();
        private readonly Random _random = new();
        
        // Параметры для более реалистичной генерации
        private float _baseRpm = 1500;
        private float _baseSpeed = 60;
        
        public ReadOnlyCollection<float> NoiseSpectrum => _noiseSpectrum.AsReadOnly();
        public ReadOnlyCollection<float> LeftVibrationSpectrum => _leftVibrationSpectrum.AsReadOnly();
        public ReadOnlyCollection<float> RightVibrationSpectrum => _rightVibrationSpectrum.AsReadOnly();
        
        public event EventHandler? SpectrogramsUpdated;
        
        public SpectrogramService()
        {
            // Инициализируем пустые массивы
            for (int i = 0; i < 16; i++)
                _noiseSpectrum.Add(0);
            for (int i = 0; i < 8; i++)
            {
                _leftVibrationSpectrum.Add(0);
                _rightVibrationSpectrum.Add(0);
            }
        }
        
        public float[] GetNoiseSpectrum(int bins = 16)
        {
            var spectrum = new float[bins];
            var time = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() / 1000.0;
            
            // Основная гармоника от RPM
            float rpmFreq = _baseRpm / 60f / 10f; // Нормализованная частота
            
            // Вторая гармоника (двигатель 4-тактный)
            float engineHarmonic = rpmFreq * 2;
            
            // Шум от скорости (при 60 км/ч)
            float speedNoise = _baseSpeed / 200f;
            
            for (int i = 0; i < bins; i++)
            {
                float freq = i / (float)bins;
                
                // Основной сигнал
                float value = 0.3f + speedNoise * 0.3f;
                
                // Пик на частоте RPM
                if (Math.Abs(freq - rpmFreq) < 0.1f)
                    value += 0.4f;
                
                // Пик на второй гармонике
                if (Math.Abs(freq - engineHarmonic) < 0.1f)
                    value += 0.3f;
                
                // Высокие частоты - шинный шум
                if (freq > 0.5f)
                    value += speedNoise * freq * 0.5f;
                
                // Случайный шум
                value += (float)(_random.NextDouble() * 0.1 - 0.05);
                
                // Ограничиваем 0-1
                spectrum[i] = Math.Max(0.05f, Math.Min(0.95f, value));
            }
            
            return spectrum;
        }
        
        public float[] GetVibrationSpectrum(string wheel, int bins = 8)
        {
            var spectrum = new float[bins];
            var time = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() / 1000.0;
            
            // Частота вращения колеса от скорости
            // При 60 км/ч ~ 10 Гц для колеса
            float wheelFreq = _baseSpeed / 60f / 10f;
            
            // Имитируем разбалансировку
            float imbalance = wheel == "left" ? 0.2f : 0.15f;
            
            for (int i = 0; i < bins; i++)
            {
                float freq = i / (float)bins;
                float value = 0.2f;
                
                // Основная частота вращения
                if (Math.Abs(freq - wheelFreq) < 0.15f)
                    value += imbalance;
                
                // Вторая гармоника (неоднородность дороги)
                if (Math.Abs(freq - wheelFreq * 2) < 0.1f)
                    value += 0.15f;
                
                // Добавляем случайность
                value += (float)(_random.NextDouble() * 0.1 - 0.05);
                
                spectrum[i] = Math.Max(0.1f, Math.Min(0.9f, value));
            }
            
            return spectrum;
        }
        
        public void UpdateSpectrograms()
        {
            // Обновляем спектры
            var noise = GetNoiseSpectrum(16);
            _noiseSpectrum.Clear();
            _noiseSpectrum.AddRange(noise);
            
            var leftVib = GetVibrationSpectrum("left", 8);
            _leftVibrationSpectrum.Clear();
            _leftVibrationSpectrum.AddRange(leftVib);
            
            var rightVib = GetVibrationSpectrum("right", 8);
            _rightVibrationSpectrum.Clear();
            _rightVibrationSpectrum.AddRange(rightVib);
            
            SpectrogramsUpdated?.Invoke(this, EventArgs.Empty);
        }
        
        /// <summary>
        /// Обновить параметры двигателя для расчета спектров
        /// </summary>
        public void UpdateEngineParameters(float rpm, float speed)
        {
            _baseRpm = rpm;
            _baseSpeed = speed;
        }
    }
}
