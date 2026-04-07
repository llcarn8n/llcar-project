import type { DiagnosticReport } from '../hooks/useDiagnosticV2'

/**
 * Generate a printable HTML report and trigger browser print/save dialog.
 * Uses a hidden iframe for clean print output without dashboard chrome.
 */
export function exportReport(report: DiagnosticReport, clientHash: string) {
  const canDriveLabels = { safe: 'БЕЗОПАСНО', caution: 'ОСТОРОЖНО', stop: 'НЕ ЕХАТЬ' }
  const canDriveColors = { safe: '#00E676', caution: '#FFAB00', stop: '#FF1744' }

  const driveLabel = canDriveLabels[report.can_drive] || report.can_drive
  const driveColor = canDriveColors[report.can_drive] || '#666'

  const now = new Date().toLocaleString('ru-RU')
  const scores = report.health_scores

  const diagnosesHtml = report.diagnoses
    .filter(d => d.status === 'likely' || d.status === 'possible')
    .map(d => `
      <div style="border-left: 3px solid ${d.status === 'likely' ? '#FF1744' : '#FFAB00'}; padding: 8px 12px; margin-bottom: 8px; background: #f9f9f9;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong>${d.display}</strong>
          <span style="color: ${d.status === 'likely' ? '#FF1744' : '#FFAB00'}; font-size: 13px;">
            ${d.status === 'likely' ? 'ВЕРОЯТНО' : 'ВОЗМОЖНО'} ${d.confidence}%
          </span>
        </div>
        ${d.explanation ? `<p style="color: #555; font-size: 13px; margin: 4px 0;">${d.explanation}</p>` : ''}
        ${d.repair_roadmap && d.repair_roadmap.length > 0 ? `
          <div style="margin-top: 6px; font-size: 12px; color: #333;">
            <strong>Маршрут ремонта:</strong>
            <ol style="margin: 4px 0; padding-left: 20px;">${d.repair_roadmap.map(s => `<li>${s}</li>`).join('')}</ol>
          </div>
        ` : ''}
        ${d.price_range ? `<div style="font-size: 12px; color: #888;">Ориентировочно: ${d.price_range}</div>` : ''}
      </div>
    `).join('')

  const fuelLossHtml = report.fuel_loss ? `
    <h3>Потери топлива</h3>
    <p style="font-size: 18px; color: #FF6D00;">
      <strong>${report.fuel_loss.monthly_rub.toLocaleString('ru-RU')} \u20BD/мес</strong>
      \u00B7 ${report.fuel_loss.yearly_rub.toLocaleString('ru-RU')} \u20BD/год
    </p>
  ` : ''

  const recallsHtml = report.recalls && report.recalls.length > 0 ? `
    <h3>Отзывные кампании (${report.recalls.length})</h3>
    ${report.recalls.map(r => `
      <div style="border-left: 2px solid #FF6D00; padding: 4px 8px; margin-bottom: 6px; font-size: 12px;">
        <strong>${r.title_ru || r.id}</strong><br/>
        ${r.date} \u00B7 ${r.source} \u00B7 ${(r.count || 0).toLocaleString('ru-RU')} авто
      </div>
    `).join('')}
  ` : ''

  const nextStepsHtml = report.next_steps && report.next_steps.length > 0 ? `
    <h3>Рекомендации</h3>
    <ol>${report.next_steps.map(s => `<li>${s}</li>`).join('')}</ol>
  ` : ''

  const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>LLCAR Диагностический отчёт</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #222; }
        h1 { color: #0891b2; border-bottom: 2px solid #0891b2; padding-bottom: 8px; }
        h2 { color: #333; margin-top: 24px; }
        h3 { color: #555; margin-top: 16px; font-size: 15px; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .can-drive { font-size: 24px; font-weight: bold; padding: 8px 20px; border-radius: 4px; display: inline-block; }
        .scores { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 12px 0; }
        .score-card { text-align: center; padding: 12px 8px; border: 1px solid #ddd; border-radius: 4px; }
        .score-value { font-size: 24px; font-weight: bold; }
        .score-label { font-size: 11px; color: #888; text-transform: uppercase; }
        .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px; font-size: 11px; color: #999; text-align: center; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <h1>LLCAR Диагностический отчёт</h1>
      <div class="header">
        <div>
          <div style="font-size: 12px; color: #888;">Клиент: ${clientHash.substring(0, 8)}...</div>
          <div style="font-size: 12px; color: #888;">Дата: ${now}</div>
          <div style="font-size: 12px; color: #888;">Версия правил: ${report.rule_version}</div>
        </div>
        <div class="can-drive" style="color: ${driveColor}; border: 2px solid ${driveColor};">
          ${driveLabel}
        </div>
      </div>

      <h2>Оценка здоровья</h2>
      <div class="scores">
        <div class="score-card">
          <div class="score-value" style="color: ${scores.overall >= 80 ? '#00E676' : scores.overall >= 50 ? '#FFAB00' : '#FF1744'}">${scores.overall}</div>
          <div class="score-label">Общий</div>
        </div>
        <div class="score-card">
          <div class="score-value">${scores.suspension}</div>
          <div class="score-label">Подвеска</div>
        </div>
        <div class="score-card">
          <div class="score-value">${scores.engine}</div>
          <div class="score-label">Двигатель</div>
        </div>
        <div class="score-card">
          <div class="score-value">${scores.electrical}</div>
          <div class="score-label">Электрика</div>
        </div>
        <div class="score-card">
          <div class="score-value">${scores.audio}</div>
          <div class="score-label">Аудио</div>
        </div>
      </div>

      ${diagnosesHtml ? `<h2>Диагнозы</h2>${diagnosesHtml}` : '<h2>Диагнозы</h2><p style="color: #00E676;">Проблем не обнаружено</p>'}

      ${fuelLossHtml}
      ${recallsHtml}
      ${nextStepsHtml}

      <div class="footer">
        LLCAR \u2014 Long Life Car \u00B7 Автоматическая диагностика \u00B7 llcar.ru
        <br/>Данные на основе ${report.baseline_status.total_samples} замеров.
        ${report.baseline_status.ready ? 'Baseline калиброван.' : `Нужно ещё ${report.baseline_status.samples_needed - report.baseline_status.total_samples} замеров для точности.`}
      </div>
    </body>
    </html>
  `

  // Open in new window for print
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }
}
