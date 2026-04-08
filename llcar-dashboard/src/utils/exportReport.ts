import type { DiagnosticReport, Diagnosis } from '../hooks/useDiagnosticV2'

/* ── Helper functions ── */

function scoreColor(score: number): string {
  if (score >= 80) return '#059669'
  if (score >= 50) return '#D97706'
  return '#DC2626'
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Отлично'
  if (score >= 80) return 'Хорошо'
  if (score >= 60) return 'Удовлетворительно'
  if (score >= 40) return 'Требует внимания'
  return 'Критично'
}

function confidenceBadge(confidence: number): string {
  if (confidence >= 80) return '#DC2626'
  if (confidence >= 50) return '#D97706'
  return '#6B7280'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    likely: 'Вероятно',
    possible: 'Возможно',
    unlikely: 'Маловероятно',
    clear: 'Норма',
  }
  return map[status] || status
}

function statusColor(status: string): string {
  const map: Record<string, string> = {
    likely: '#DC2626',
    possible: '#D97706',
    unlikely: '#6B7280',
    clear: '#059669',
  }
  return map[status] || '#6B7280'
}

function generateReportId(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `LLCAR-${date}-${rand}`
}

function getVehicleInfo(): { brand: string; model: string; year: string; engine: string } {
  try {
    const raw = localStorage.getItem('llcar-vehicle-profile')
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        brand: parsed.brand || 'Li Auto',
        model: parsed.model || 'L7',
        year: parsed.year || '2023',
        engine: parsed.engine || '1.5T EREV',
      }
    }
  } catch { /* ignore */ }
  return { brand: 'Li Auto', model: 'L7', year: '2023', engine: '1.5T EREV' }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/* ── Score bar HTML generator ── */

function scoreBarHtml(label: string, value: number, maxVal = 100): string {
  const pct = Math.max(0, Math.min(100, (value / maxVal) * 100))
  const color = scoreColor(value)
  return `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
      <div style="width: 100px; font-size: 13px; color: #374151; font-weight: 500;">${label}</div>
      <div style="flex: 1; height: 18px; background: #F3F4F6; border-radius: 9px; overflow: hidden; position: relative;">
        <div style="
          height: 100%; width: ${pct}%; background: ${color};
          border-radius: 9px; transition: width 0.3s;
        "></div>
      </div>
      <div style="width: 40px; text-align: right; font-size: 14px; font-weight: 700; color: ${color};">${value}</div>
    </div>
  `
}

/* ── Diagnosis row HTML ── */

function diagnosisRowHtml(diag: Diagnosis, index: number): string {
  const stColor = statusColor(diag.status)
  const stLabel = statusLabel(diag.status)

  return `
    <tr>
      <td style="padding: 10px 8px; border-bottom: 1px solid #E5E7EB; text-align: center; color: #9CA3AF; font-size: 12px;">${index + 1}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #111827;">${escapeHtml(diag.display)}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #E5E7EB; text-align: center;">
        <span style="
          display: inline-block; padding: 2px 10px; border-radius: 10px;
          font-size: 11px; font-weight: 600; color: white;
          background: ${stColor};
        ">${stLabel}</span>
      </td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #E5E7EB; text-align: center;">
        <span style="font-weight: 700; color: ${confidenceBadge(diag.confidence)};">${diag.confidence}%</span>
      </td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #E5E7EB; color: #4B5563; font-size: 12px; line-height: 1.5;">
        ${diag.explanation ? escapeHtml(diag.explanation) : '\u2014'}
      </td>
    </tr>
  `
}

/* ── Repair & price section for a diagnosis ── */

function repairSectionHtml(diag: Diagnosis): string {
  const hasRoadmap = diag.repair_roadmap && diag.repair_roadmap.length > 0
  const hasPrice = diag.price_range && diag.price_range.trim().length > 0

  if (!hasRoadmap && !hasPrice) return ''

  let html = `
    <div style="margin-bottom: 16px; padding: 14px 16px; background: #F9FAFB; border-radius: 6px; border-left: 4px solid ${statusColor(diag.status)};">
      <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px;">${escapeHtml(diag.display)}</div>
  `

  if (hasRoadmap) {
    html += `<div style="margin-bottom: 8px;">`
    diag.repair_roadmap.forEach((step, i) => {
      html += `
        <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
          <div style="
            min-width: 22px; height: 22px; border-radius: 50%;
            background: #0D9488; color: white; font-size: 11px; font-weight: 700;
            display: flex; align-items: center; justify-content: center;
          ">${i + 1}</div>
          <div style="font-size: 13px; color: #374151; line-height: 1.5; padding-top: 2px;">${escapeHtml(step)}</div>
        </div>
      `
    })
    html += `</div>`
  }

  if (hasPrice) {
    html += `
      <div style="
        display: inline-block; padding: 4px 12px; background: #0D948815;
        border: 1px solid #0D948830; border-radius: 4px;
        font-size: 13px; color: #0D9488; font-weight: 600;
      ">
        \u20BD ${escapeHtml(diag.price_range)}
      </div>
    `
  }

  html += `</div>`
  return html
}

/* ── Can-drive badge ── */

function canDriveBadgeHtml(canDrive: string): string {
  const config: Record<string, { label: string; sublabel: string; bg: string; border: string; text: string }> = {
    safe: {
      label: '\u2713 \u0411\u0415\u0417\u041E\u041F\u0410\u0421\u041D\u041E',
      sublabel: 'Критических проблем не обнаружено. Эксплуатация безопасна.',
      bg: '#ECFDF5', border: '#059669', text: '#065F46',
    },
    caution: {
      label: '\u26A0 \u041E\u0421\u0422\u041E\u0420\u041E\u0416\u041D\u041E',
      sublabel: 'Обнаружены проблемы. Рекомендуется диагностика на СТО.',
      bg: '#FFFBEB', border: '#D97706', text: '#92400E',
    },
    stop: {
      label: '\u2715 \u041E\u0421\u0422\u0410\u041D\u041E\u0412\u0418\u0422\u042C\u0421\u042F',
      sublabel: 'Обнаружены критические проблемы. Движение небезопасно!',
      bg: '#FEF2F2', border: '#DC2626', text: '#991B1B',
    },
  }

  const c = config[canDrive] || config.caution

  return `
    <div style="
      padding: 20px 24px; border-radius: 8px; text-align: center;
      background: ${c.bg}; border: 2px solid ${c.border};
    ">
      <div style="font-size: 26px; font-weight: 800; color: ${c.text}; letter-spacing: 0.05em;">${c.label}</div>
      <div style="font-size: 13px; color: ${c.text}; margin-top: 6px; opacity: 0.8;">${c.sublabel}</div>
    </div>
  `
}

/* ── Main export function ── */

/**
 * Generate a professional printable HTML diagnostic report and open it
 * in a new browser window for printing / saving as PDF.
 * Designed for A4 paper, print-friendly (white background, no web fonts).
 */
export function exportReport(report: DiagnosticReport, clientHash: string) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const reportId = generateReportId()
  const vehicle = getVehicleInfo()
  const scores = report.health_scores

  const activeDiagnoses = report.diagnoses.filter(d => d.status === 'likely' || d.status === 'possible')
  const hasRepairData = activeDiagnoses.some(d =>
    (d.repair_roadmap && d.repair_roadmap.length > 0) || (d.price_range && d.price_range.trim().length > 0)
  )

  /* ── Diagnoses table ── */
  let diagnosesTableHtml: string
  if (activeDiagnoses.length > 0) {
    diagnosesTableHtml = `
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="background: #F9FAFB;">
            <th style="padding: 10px 8px; text-align: center; font-size: 11px; color: #6B7280; font-weight: 600; border-bottom: 2px solid #E5E7EB; width: 30px;">#</th>
            <th style="padding: 10px 8px; text-align: left; font-size: 11px; color: #6B7280; font-weight: 600; border-bottom: 2px solid #E5E7EB;">Диагноз</th>
            <th style="padding: 10px 8px; text-align: center; font-size: 11px; color: #6B7280; font-weight: 600; border-bottom: 2px solid #E5E7EB; width: 90px;">Статус</th>
            <th style="padding: 10px 8px; text-align: center; font-size: 11px; color: #6B7280; font-weight: 600; border-bottom: 2px solid #E5E7EB; width: 70px;">Уверенность</th>
            <th style="padding: 10px 8px; text-align: left; font-size: 11px; color: #6B7280; font-weight: 600; border-bottom: 2px solid #E5E7EB;">Пояснение</th>
          </tr>
        </thead>
        <tbody>
          ${activeDiagnoses.map((d, i) => diagnosisRowHtml(d, i)).join('')}
        </tbody>
      </table>
    `
  } else {
    diagnosesTableHtml = `
      <div style="padding: 24px; text-align: center; background: #ECFDF5; border-radius: 8px; border: 1px solid #A7F3D0;">
        <div style="font-size: 28px; margin-bottom: 8px;">\u2713</div>
        <div style="font-size: 16px; font-weight: 600; color: #065F46;">Проблем не обнаружено</div>
        <div style="font-size: 13px; color: #6B7280; margin-top: 4px;">Все параметры в пределах нормы</div>
      </div>
    `
  }

  /* ── Repair roadmap section ── */
  let repairHtml = ''
  if (hasRepairData) {
    repairHtml = `
      <div style="page-break-before: auto; margin-top: 32px;">
        <h2 style="
          font-size: 16px; font-weight: 700; color: #0D9488;
          padding-bottom: 8px; border-bottom: 2px solid #0D9488;
          margin: 0 0 16px 0; letter-spacing: 0.02em;
        ">6. ПЛАН РЕМОНТА И СТОИМОСТЬ</h2>
        <p style="font-size: 12px; color: #6B7280; margin: 0 0 16px 0;">
          Шаги упорядочены от дешёвых к дорогим. Начните с первого шага \u2014 часто он решает проблему.
        </p>
        ${activeDiagnoses.map(d => repairSectionHtml(d)).join('')}
      </div>
    `
  }

  /* ── Fuel loss section ── */
  let fuelLossHtml = ''
  if (report.fuel_loss) {
    fuelLossHtml = `
      <div style="
        margin-top: 16px; padding: 14px 20px; border-radius: 6px;
        background: #FFFBEB; border: 1px solid #FCD34D;
        display: flex; justify-content: space-between; align-items: center;
      ">
        <div>
          <div style="font-size: 11px; font-weight: 600; color: #92400E; letter-spacing: 0.05em; margin-bottom: 4px;">ПОТЕРИ ТОПЛИВА</div>
          <div style="font-size: 12px; color: #78350F;">Из-за выявленных проблем автомобиль расходует больше топлива</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 20px; font-weight: 800; color: #D97706;">${report.fuel_loss.monthly_rub.toLocaleString('ru-RU')} \u20BD/мес</div>
          <div style="font-size: 13px; color: #92400E;">${report.fuel_loss.yearly_rub.toLocaleString('ru-RU')} \u20BD/год</div>
        </div>
      </div>
    `
  }

  /* ── Recalls section ── */
  let recallsHtml = ''
  if (report.recalls && report.recalls.length > 0) {
    recallsHtml = `
      <div style="margin-top: 20px;">
        <div style="font-size: 13px; font-weight: 700; color: #D97706; margin-bottom: 8px;">
          \u26A0 ОТЗЫВНЫЕ КАМПАНИИ (${report.recalls.length})
        </div>
        ${report.recalls.map(r => `
          <div style="padding: 8px 12px; margin-bottom: 6px; background: #FFFBEB; border-radius: 4px; border-left: 3px solid #D97706;">
            <div style="font-size: 13px; font-weight: 600; color: #111827;">${escapeHtml(r.title_ru || r.id)}</div>
            <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">
              ${escapeHtml(r.date)} \u00B7 ${escapeHtml(r.source)} \u00B7 ${(r.count || 0).toLocaleString('ru-RU')} авто
            </div>
          </div>
        `).join('')}
      </div>
    `
  }

  /* ── Next steps / recommendations ── */
  let nextStepsHtml = ''
  if (report.next_steps && report.next_steps.length > 0) {
    nextStepsHtml = `
      <div style="page-break-before: auto; margin-top: 32px;">
        <h2 style="
          font-size: 16px; font-weight: 700; color: #0D9488;
          padding-bottom: 8px; border-bottom: 2px solid #0D9488;
          margin: 0 0 16px 0; letter-spacing: 0.02em;
        ">7. РЕКОМЕНДАЦИИ</h2>
        <div style="padding: 0;">
          ${report.next_steps.map((step, i) => `
            <div style="
              display: flex; align-items: flex-start; gap: 12px;
              padding: 10px 0; ${i < report.next_steps.length - 1 ? 'border-bottom: 1px solid #F3F4F6;' : ''}
            ">
              <div style="
                min-width: 26px; height: 26px; border-radius: 50%;
                background: #F0FDFA; border: 1.5px solid #0D9488;
                color: #0D9488; font-size: 12px; font-weight: 700;
                display: flex; align-items: center; justify-content: center;
              ">${i + 1}</div>
              <div style="font-size: 13px; color: #374151; line-height: 1.6; padding-top: 4px;">${escapeHtml(step)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  /* ── Data source info ── */
  let dataSourceHtml = ''
  if (report.data_source) {
    const sources: string[] = []
    if (report.data_source.has_obd) sources.push(`OBD-II${report.data_source.obd_packets ? ` (${report.data_source.obd_packets} пакетов)` : ''}`)
    if (report.data_source.has_accel) sources.push('Акселерометр')
    if (report.data_source.has_audio) sources.push('Аудио-анализ')
    dataSourceHtml = `
      <div style="font-size: 11px; color: #9CA3AF; margin-top: 6px;">
        Источники данных: ${sources.join(', ')} \u00B7 Период: ${report.data_source.minutes_searched} мин
      </div>
    `
  }

  /* ── Full HTML document ── */
  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LLCAR \u2014 \u0414\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043E\u0442\u0447\u0451\u0442 ${reportId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4;
      margin: 16mm 14mm 20mm 14mm;
    }

    body {
      font-family: -apple-system, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      font-size: 13px;
      color: #111827;
      background: white;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 0;
    }

    .page-break {
      page-break-before: always;
    }

    h2 {
      font-size: 16px;
      font-weight: 700;
      color: #0D9488;
      padding-bottom: 8px;
      border-bottom: 2px solid #0D9488;
      margin: 0 0 16px 0;
      letter-spacing: 0.02em;
    }

    table {
      page-break-inside: auto;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    @media print {
      body { padding: 0; }
      .page { max-width: none; }
      .no-print { display: none !important; }
    }

    @media screen {
      body { padding: 20px; background: #F3F4F6; }
      .page {
        background: white;
        padding: 40px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.12);
        border-radius: 4px;
        margin-bottom: 20px;
      }
    }

    .print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #0D9488;
      color: white;
      padding: 12px 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      z-index: 9999;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .print-bar button {
      padding: 8px 24px;
      background: white;
      color: #0D9488;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.02em;
    }

    .print-bar button:hover {
      background: #F0FDFA;
    }
  </style>
</head>
<body>
  <!-- Print action bar (screen only) -->
  <div class="print-bar no-print">
    <span>\u0414\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043E\u0442\u0447\u0451\u0442 \u0433\u043E\u0442\u043E\u0432</span>
    <button onclick="window.print()">\u041F\u0435\u0447\u0430\u0442\u044C / \u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C PDF</button>
  </div>

  <div class="page" style="margin-top: 60px;">
    <!-- ═══════════════════════════════════════════ -->
    <!-- 1. HEADER                                   -->
    <!-- ═══════════════════════════════════════════ -->
    <div style="
      display: flex; justify-content: space-between; align-items: flex-start;
      padding-bottom: 20px; border-bottom: 3px solid #0D9488;
      margin-bottom: 24px;
    ">
      <div>
        <div style="
          font-size: 28px; font-weight: 900; color: #0D9488;
          letter-spacing: 0.08em; line-height: 1;
        ">LLCAR</div>
        <div style="font-size: 10px; color: #6B7280; letter-spacing: 0.15em; margin-top: 2px;">LONG LIFE CAR</div>
      </div>
      <div style="text-align: right;">
        <div style="
          font-size: 18px; font-weight: 800; color: #111827;
          letter-spacing: 0.03em;
        ">\u0414\u0418\u0410\u0413\u041D\u041E\u0421\u0422\u0418\u0427\u0415\u0421\u041A\u0418\u0419 \u041E\u0422\u0427\u0401\u0422</div>
        <div style="font-size: 12px; color: #6B7280; margin-top: 4px;">
          ${dateStr}, ${timeStr}
        </div>
        <div style="font-size: 11px; color: #9CA3AF; font-family: 'Courier New', Courier, monospace; margin-top: 2px;">
          ${reportId}
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- 2. VEHICLE INFO                             -->
    <!-- ═══════════════════════════════════════════ -->
    <div style="
      display: flex; gap: 0; margin-bottom: 24px;
      border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;
    ">
      ${[
        { label: 'Марка', value: vehicle.brand },
        { label: 'Модель', value: vehicle.model },
        { label: 'Год', value: vehicle.year },
        { label: 'Двигатель', value: vehicle.engine },
      ].map((item, i, arr) => `
        <div style="
          flex: 1; padding: 12px 16px; text-align: center;
          ${i < arr.length - 1 ? 'border-right: 1px solid #E5E7EB;' : ''}
          background: #F9FAFB;
        ">
          <div style="font-size: 10px; font-weight: 600; color: #9CA3AF; letter-spacing: 0.08em; margin-bottom: 4px;">${item.label.toUpperCase()}</div>
          <div style="font-size: 15px; font-weight: 700; color: #111827;">${escapeHtml(item.value)}</div>
        </div>
      `).join('')}
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- 3. HEALTH SCORE                             -->
    <!-- ═══════════════════════════════════════════ -->
    <h2>3. \u041E\u0426\u0415\u041D\u041A\u0410 \u0417\u0414\u041E\u0420\u041E\u0412\u042C\u042F</h2>

    <div style="display: flex; gap: 24px; align-items: flex-start; margin-bottom: 24px;">
      <!-- Overall score circle -->
      <div style="text-align: center; min-width: 130px;">
        <div style="
          width: 110px; height: 110px; border-radius: 50%;
          border: 6px solid ${scoreColor(scores.overall)};
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          margin: 0 auto 8px;
        ">
          <div style="font-size: 38px; font-weight: 900; color: ${scoreColor(scores.overall)}; line-height: 1;">${scores.overall}</div>
          <div style="font-size: 10px; color: #6B7280; font-weight: 500;">/ 100</div>
        </div>
        <div style="font-size: 13px; font-weight: 600; color: ${scoreColor(scores.overall)};">${scoreLabel(scores.overall)}</div>
      </div>

      <!-- System scores -->
      <div style="flex: 1; padding-top: 8px;">
        ${scoreBarHtml('\u041F\u043E\u0434\u0432\u0435\u0441\u043A\u0430', scores.suspension)}
        ${scoreBarHtml('\u0414\u0432\u0438\u0433\u0430\u0442\u0435\u043B\u044C', scores.engine)}
        ${scoreBarHtml('\u042D\u043B\u0435\u043A\u0442\u0440\u0438\u043A\u0430', scores.electrical)}
        ${scoreBarHtml('\u0410\u0443\u0434\u0438\u043E', scores.audio)}
      </div>
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- 4. CAN DRIVE STATUS                         -->
    <!-- ═══════════════════════════════════════════ -->
    <h2>4. \u041C\u041E\u0416\u041D\u041E \u041B\u0418 \u0415\u0425\u0410\u0422\u042C?</h2>
    <div style="margin-bottom: 24px;">
      ${canDriveBadgeHtml(report.can_drive)}
    </div>

    <!-- ═══════════════════════════════════════════ -->
    <!-- 5. DIAGNOSES TABLE                          -->
    <!-- ═══════════════════════════════════════════ -->
    <h2>5. \u0414\u0418\u0410\u0413\u041D\u041E\u0417\u042B</h2>
    <div style="margin-bottom: 16px;">
      ${diagnosesTableHtml}
    </div>

    ${fuelLossHtml}
    ${recallsHtml}

    <!-- ═══════════════════════════════════════════ -->
    <!-- 6. REPAIR ROADMAP + PRICES                  -->
    <!-- ═══════════════════════════════════════════ -->
    ${repairHtml}

    <!-- ═══════════════════════════════════════════ -->
    <!-- 7. RECOMMENDATIONS                          -->
    <!-- ═══════════════════════════════════════════ -->
    ${nextStepsHtml}

    <!-- ═══════════════════════════════════════════ -->
    <!-- FOOTER                                      -->
    <!-- ═══════════════════════════════════════════ -->
    <div style="
      margin-top: 40px; padding-top: 16px;
      border-top: 2px solid #E5E7EB;
      display: flex; justify-content: space-between; align-items: flex-end;
    ">
      <div>
        <div style="font-size: 12px; color: #6B7280;">
          \u041E\u0442\u0447\u0451\u0442 \u0441\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u043D <strong style="color: #0D9488;">LLCAR</strong> \u00B7
          <a href="https://llcar.ru" style="color: #0D9488; text-decoration: none;">llcar.ru</a> \u00B7
          ${dateStr}
        </div>
        <div style="font-size: 12px; color: #6B7280; margin-top: 2px;">
          \u0412\u0435\u0440\u0441\u0438\u044F \u043F\u0440\u0430\u0432\u0438\u043B: ${escapeHtml(report.rule_version)} \u00B7
          \u0411\u0430\u0437\u0430: ${report.baseline_status.total_samples} \u0437\u0430\u043C\u0435\u0440\u043E\u0432
          ${report.baseline_status.ready ? '(\u043A\u0430\u043B\u0438\u0431\u0440\u043E\u0432\u0430\u043D\u0430)' : `(\u043D\u0443\u0436\u043D\u043E \u0435\u0449\u0451 ${report.baseline_status.samples_needed - report.baseline_status.total_samples})`}
        </div>
        ${dataSourceHtml}
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; color: #9CA3AF; font-family: 'Courier New', Courier, monospace;">${reportId}</div>
        <div style="font-size: 10px; color: #D1D5DB; font-family: 'Courier New', Courier, monospace; margin-top: 2px;">ID: ${clientHash.substring(0, 8)}</div>
      </div>
    </div>

    <div style="
      margin-top: 12px; padding: 10px 16px;
      background: #F9FAFB; border-radius: 6px; border: 1px solid #E5E7EB;
      text-align: center;
    ">
      <div style="font-size: 11px; color: #9CA3AF; line-height: 1.6;">
        \u041E\u0442\u0447\u0451\u0442 \u043D\u043E\u0441\u0438\u0442 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0445\u0430\u0440\u0430\u043A\u0442\u0435\u0440 \u0438 \u043D\u0435 \u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u043E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u044B\u043C \u0437\u0430\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435\u043C \u0421\u0422\u041E.
        \u0414\u043B\u044F \u0442\u043E\u0447\u043D\u043E\u0439 \u0434\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u043A\u0438 \u043E\u0431\u0440\u0430\u0442\u0438\u0442\u0435\u0441\u044C \u043A \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u0446\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u043C\u0443 \u0441\u043F\u0435\u0446\u0438\u0430\u043B\u0438\u0441\u0442\u0443.
      </div>
    </div>
  </div>
</body>
</html>`

  // Open in new window for print
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    // Auto-trigger print after render
    setTimeout(() => {
      printWindow.print()
    }, 600)
  }
}
