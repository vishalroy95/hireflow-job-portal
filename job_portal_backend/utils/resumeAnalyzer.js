const { getOrCreateSettings } = require('./platformSettings');

const clampScore = (value) => {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
};

const asArray = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  return [];
};

const normalizeGeminiModel = (model) => {
  const requestedModel = String(model || '').trim();
  const legacyModelMap = {
    'gemini-1.5-flash': 'gemini-2.5-flash',
    'gemini-1.5-flash-8b': 'gemini-2.5-flash-lite',
  };

  return legacyModelMap[requestedModel] || requestedModel || 'gemini-2.5-flash';
};

const getGeminiConfig = async () => {
  const settings = await getOrCreateSettings();
  const aiSettings = settings.ai || {};

  return {
    provider: process.env.AI_PROVIDER || 'gemini',
    apiKey: process.env.GEMINI_API_KEY || '',
    model: normalizeGeminiModel(aiSettings.model || process.env.GEMINI_MODEL),
    enabled: Boolean(aiSettings.resumeAnalyzerEnabled),
    manualOnly: aiSettings.manualOnly !== false,
  };
};

const stripCodeFence = (text = '') =>
  String(text)
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

const parseJsonResponse = (text = '') => {
  const cleaned = stripCodeFence(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('AI returned an unreadable response. Please try again.');
  }
};

const buildCandidateSnapshot = ({ candidate, profile, application }) => ({
  name: candidate?.name || 'Candidate',
  skills: candidate?.skills || profile?.resumeParsed?.skills || [],
  headline: profile?.resumeParsed?.headline || '',
  biography: candidate?.bio || '',
  location: profile?.location || '',
  education: profile?.education || [],
  experience: profile?.experience || [],
  resumeFileName: profile?.resumeFile?.originalName || application?.resume || candidate?.resume || profile?.resume || '',
  coverLetter: application?.coverLetter || '',
});

const buildJobSnapshot = (job = {}) => ({
  title: job.title || '',
  company: job.company || '',
  location: job.location || '',
  description: job.description || '',
  responsibilities: job.responsibilities || '',
  requirements: job.requirements || '',
  skillsRequired: job.skillsRequired || [],
  experience: job.experience || '',
  workplaceType: job.workplaceType || '',
  jobType: job.jobType || '',
});

const buildPrompt = (context) => {
  const candidate = buildCandidateSnapshot(context);
  const job = buildJobSnapshot(context.job);

  return `
You are HireFlow's resume analyzer for a job portal demo.
Analyze how well this candidate matches this job using only the provided data.
Be practical, fair, concise, and recruiter-friendly.

Return only valid JSON with this exact shape:
{
  "matchScore": 0,
  "summary": "one short paragraph",
  "matchedSkills": [],
  "missingSkills": [],
  "strengths": [],
  "concerns": [],
  "suggestions": [],
  "interviewQuestions": []
}

Scoring guidance:
- 80-100: strong fit
- 60-79: good but missing some proof
- 40-59: partial fit
- 0-39: weak fit

Candidate:
${JSON.stringify(candidate, null, 2)}

Job:
${JSON.stringify(job, null, 2)}
`;
};

const normalizeAnalysis = (analysis, fallbackScore = 0) => ({
  matchScore: clampScore(analysis.matchScore ?? fallbackScore),
  summary: String(analysis.summary || `${fallbackScore}% match based on available profile and job data.`).slice(0, 700),
  matchedSkills: asArray(analysis.matchedSkills),
  missingSkills: asArray(analysis.missingSkills),
  strengths: asArray(analysis.strengths),
  concerns: asArray(analysis.concerns),
  suggestions: asArray(analysis.suggestions),
  interviewQuestions: asArray(analysis.interviewQuestions),
});

const isGeminiCapacityError = (status, message = '') => {
  const normalizedMessage = String(message).toLowerCase();
  return (
    status === 429 ||
    status === 503 ||
    normalizedMessage.includes('high demand') ||
    normalizedMessage.includes('overloaded') ||
    normalizedMessage.includes('temporarily unavailable')
  );
};

const callGeminiModel = async ({ apiKey, model, context }) => {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildPrompt(context) }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    let message = `Gemini analysis failed: ${response.status}`;

    try {
      const payload = JSON.parse(body);
      message = payload?.error?.message || message;
    } catch {
      // Keep the generic status message when Gemini returns non-JSON.
    }

    const error = new Error(message);
    error.statusCode = 502;
    error.geminiStatus = response.status;
    error.retryable = isGeminiCapacityError(response.status, message);
    error.details = body.slice(0, 500);
    throw error;
  }

  return response.json();
};

const analyzeResumeWithGemini = async (context) => {
  const { provider, apiKey, model, enabled } = await getGeminiConfig();

  if (!enabled) {
    const error = new Error('AI resume analyzer is disabled. Enable it from Admin Settings > AI Resume Analyzer.');
    error.statusCode = 400;
    throw error;
  }

  if (provider !== 'gemini') {
    const error = new Error('Unsupported AI provider. Set AI_PROVIDER=gemini.');
    error.statusCode = 400;
    throw error;
  }

  if (!apiKey) {
    const error = new Error('Gemini API key is missing. Add GEMINI_API_KEY in backend .env.');
    error.statusCode = 400;
    throw error;
  }

  const fallbackModel = 'gemini-2.5-flash-lite';
  let usedModel = model;
  let payload;

  try {
    payload = await callGeminiModel({ apiKey, model, context });
  } catch (error) {
    if (!error.retryable || model === fallbackModel) {
      throw error;
    }

    usedModel = fallbackModel;
    payload = await callGeminiModel({ apiKey, model: fallbackModel, context });
  }

  const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n') || '';
  const parsed = parseJsonResponse(text);

  return {
    provider,
    model: usedModel,
    rawResponse: parsed,
    ...normalizeAnalysis(parsed, context.application?.skillMatch || 0),
  };
};

module.exports = {
  analyzeResumeWithGemini,
  normalizeAnalysis,
};
