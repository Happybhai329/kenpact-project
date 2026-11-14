const reportsService = require('../reports/reports.service');

const SLOT_NAMES = {
  morning_fasting: 'Morning (fasting)',
  after_breakfast: 'After breakfast',
  after_lunch: 'After lunch',
  after_dinner: 'After dinner',
};

/**
 * Deterministic clinical rule engine fallback.
 * Follows American Diabetes Association (ADA) target standards:
 * - Fasting: 80–130 mg/dl
 * - Post-prandial: < 180 mg/dl
 * - Hypoglycemia: < 70 mg/dl
 */
function generateClinicalFallback(reportData) {
  const { readings = [], count = 0, avg, min, max, type, startDate, endDate } = reportData;

  if (count === 0) {
    return {
      status: 'No Data',
      statusColor: 'gray',
      summary: `No blood glucose readings were recorded for the period ${startDate} to ${endDate}. Log your daily readings to generate personalized clinical insights.`,
      patterns: ['Insufficient data logged for pattern recognition.'],
      recommendations: [
        'Aim to log at least fasting and post-meal readings daily.',
        'Set regular reminders after meals to maintain consistent tracking.',
      ],
      doctorQuestions: [
        'What target glucose ranges are optimal for my personal treatment plan?',
      ],
      timeInRangePercent: 0,
      source: 'rule_engine',
      disclaimer:
        'This clinical assessment is generated for tracking and informational purposes only. Always consult your healthcare provider before adjusting medications or diet.',
    };
  }

  // Calculate Time in Range (70–140 mg/dl for tight control, 70–180 standard)
  const inRangeCount = readings.filter((r) => r.value >= 70 && r.value <= 180).length;
  const tirPercent = Math.round((inRangeCount / count) * 100);

  // Group by slot
  const slotGroups = {};
  readings.forEach((r) => {
    if (!slotGroups[r.slot]) slotGroups[r.slot] = [];
    slotGroups[r.slot].push(r.value);
  });

  const slotAverages = {};
  for (const [slot, vals] of Object.entries(slotGroups)) {
    slotAverages[slot] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  // Analyze status
  let status = 'Optimal Control';
  let statusColor = 'green';
  const patterns = [];
  const recommendations = [];
  const doctorQuestions = [];

  if (min !== null && min < 70) {
    status = 'Hypoglycemic Alert';
    statusColor = 'blue';
    patterns.push(`Detected blood glucose falling below 70 mg/dl (lowest recorded: ${min} mg/dl).`);
    recommendations.push(
      'Review hypoglycemic episodes with your physician; carry fast-acting carbohydrates (15g glucose) as a precaution.'
    );
    doctorQuestions.push(
      `I experienced readings as low as ${min} mg/dl. Should we adjust my medication timing or dosage?`
    );
  }

  if (max !== null && max >= 200) {
    if (status !== 'Hypoglycemic Alert') {
      status = 'Elevated Variability';
      statusColor = 'red';
    }
    patterns.push(`Peak glucose reached ${max} mg/dl, indicating post-prandial glycemic excursions.`);
    recommendations.push(
      'Consider evaluating portion sizes and carbohydrate density for meals preceding high spikes.'
    );
  } else if (avg > 140) {
    if (status !== 'Hypoglycemic Alert') {
      status = 'Moderate Elevation';
      statusColor = 'amber';
    }
    patterns.push(`Average glucose across the period is ${avg} mg/dl, above the 140 mg/dl ideal mean.`);
  }

  // Slot specific checks
  if (slotAverages.morning_fasting && slotAverages.morning_fasting > 130) {
    patterns.push(
      `Fasting glucose averaged ${slotAverages.morning_fasting} mg/dl, suggesting potential Dawn Phenomenon or bedtime snack impact.`
    );
    recommendations.push(
      'Monitor evening meal timing; avoid high-glycemic carbohydrates within 3 hours of sleep.'
    );
    doctorQuestions.push(
      'My fasting blood glucose is consistently elevated. Could this be related to hepatic glucose release or nighttime rebound?'
    );
  }

  if (slotAverages.after_lunch && slotAverages.after_lunch > 160) {
    patterns.push(`After lunch readings show an elevated trend (average ${slotAverages.after_lunch} mg/dl).`);
    recommendations.push('Incorporate dietary fiber and lean protein with lunch to blunt post-prandial absorption curves.');
  }

  if (patterns.length === 0) {
    patterns.push(`Excellent consistency: ${tirPercent}% of readings within the 70–180 mg/dl clinical target.`);
    patterns.push(`Mean glucose of ${avg} mg/dl demonstrates strong glycemic stability.`);
  }

  if (recommendations.length < 3) {
    recommendations.push('Maintain regular hydration and keep consistent intervals between meals.');
    recommendations.push('Continue logging all 4 daily slots to maintain robust data for your clinical team.');
  }

  if (doctorQuestions.length === 0) {
    doctorQuestions.push(
      `My average glucose over this period was ${avg} mg/dl with a ${tirPercent}% time-in-range. Does this align with my HbA1c target?`
    );
    doctorQuestions.push('Are there any specific lifestyle modifications you recommend based on my current consistency?');
  }

  const summary = `Over this ${type} reporting period (${startDate} to ${endDate}), you recorded ${count} reading${
    count === 1 ? '' : 's'
  } with an average of ${avg} mg/dl (range: ${min}–${max} mg/dl). Your estimated Time in Range is ${tirPercent}%, reflecting ${status.toLowerCase()}.`;

  return {
    status,
    statusColor,
    summary,
    patterns: patterns.slice(0, 3),
    recommendations: recommendations.slice(0, 3),
    doctorQuestions: doctorQuestions.slice(0, 2),
    timeInRangePercent: tirPercent,
    source: 'clinical_engine',
    disclaimer:
      'This clinical assessment is generated for tracking and informational purposes only. Always consult your healthcare provider before adjusting medications or diet.',
  };
}

/**
 * Generate AI Insights using Gemini 2.5 Flash with fallback to Clinical Rule Engine
 */
async function generateInsights(userId, reportType, dateStr) {
  // 1. Fetch the exact report data
  let reportData;
  if (reportType === 'daily') {
    reportData = await reportsService.daily(userId, dateStr);
  } else if (reportType === 'mtd' || reportType === 'month-to-date') {
    reportData = await reportsService.monthToDate(userId, dateStr);
  } else {
    reportData = await reportsService.monthly(userId, dateStr);
  }

  if (!reportData || reportData.count === 0) {
    return generateClinicalFallback(reportData || { count: 0, startDate: dateStr, endDate: dateStr, type: reportType });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return generateClinicalFallback(reportData);
  }

  // 2. Format clinical prompt for Gemini
  const readingsSummary = reportData.readings
    .map((r) => `${r.date.toISOString().split('T')[0]} [${SLOT_NAMES[r.slot] || r.slot}]: ${r.value} mg/dl`)
    .join('\n');

  const prompt = `You are Sweety Health AI, a clinical diabetes decision-support assistant.
Analyze the following patient blood glucose tracking data and return a professional medical assessment in JSON format according to American Diabetes Association (ADA) guidelines.

REPORT TYPE: ${reportData.type}
PERIOD: ${reportData.startDate} to ${reportData.endDate}
METRICS:
- Total Readings: ${reportData.count}
- Average Glucose: ${reportData.avg} mg/dl
- Highest: ${reportData.max} mg/dl
- Lowest: ${reportData.min} mg/dl

INDIVIDUAL READINGS:
${readingsSummary}

CLINICAL CRITERIA:
- Fasting Target: 80–130 mg/dl
- Post-prandial Target: < 180 mg/dl
- Hypoglycemia Threshold: < 70 mg/dl

Return ONLY a valid JSON object matching this exact schema:
{
  "status": "Optimal Control" | "Suboptimal" | "Elevated Variability" | "Hypoglycemic Alert",
  "statusColor": "green" | "amber" | "red" | "blue",
  "summary": "2-3 sentences concise clinical overview of glycemic stability and control",
  "patterns": ["bullet 1 clinical pattern or observation", "bullet 2 pattern", "bullet 3 pattern"],
  "recommendations": ["actionable dietary or habit suggestion 1", "actionable suggestion 2", "actionable suggestion 3"],
  "doctorQuestions": ["targeted question 1 for physician", "targeted question 2 for physician"],
  "timeInRangePercent": <number between 0 and 100 percentage of readings between 70 and 180 mg/dl>
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`Gemini API returned status ${response.status}. Falling back to clinical engine.`);
      return generateClinicalFallback(reportData);
    }

    const jsonRes = await response.json();
    const rawText = jsonRes.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return generateClinicalFallback(reportData);
    }

    const parsed = JSON.parse(rawText);
    return {
      status: parsed.status || 'Clinically Evaluated',
      statusColor: parsed.statusColor || 'green',
      summary: parsed.summary,
      patterns: Array.isArray(parsed.patterns) ? parsed.patterns : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      doctorQuestions: Array.isArray(parsed.doctorQuestions) ? parsed.doctorQuestions : [],
      timeInRangePercent: typeof parsed.timeInRangePercent === 'number' ? parsed.timeInRangePercent : 85,
      source: 'gemini_2.5_flash',
      disclaimer:
        'This clinical assessment is generated by Gemini 2.5 Flash AI for tracking and informational purposes only. Always consult your healthcare provider before adjusting medications or diet.',
    };
  } catch (err) {
    console.error('Error invoking Gemini AI, using clinical fallback:', err.message);
    return generateClinicalFallback(reportData);
  }
}

module.exports = { generateInsights, generateClinicalFallback };
