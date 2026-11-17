const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const analyzeResumeWithAI = async (resume) => {
  const prompt = `
You are an expert recruitment AI.

Analyze the following candidate resume and return a structured JSON response.

Candidate Resume:

Professional Summary:
${resume.professionalSummary || "Not provided"}

Skills:
${resume.skills?.join(", ") || "Not provided"}

Education:
${JSON.stringify(resume.education || [])}

Experience:
${JSON.stringify(resume.experience || [])}

Projects:
${JSON.stringify(resume.projects || [])}

Certifications:
${JSON.stringify(resume.certifications || [])}

Achievements:
${JSON.stringify(resume.achievements || [])}

Languages:
${resume.languages?.join(", ") || "Not provided"}

Return JSON with exactly these fields:

{
  "resumeScore": number,
  "skillsDetected": [],
  "strengths": [],
  "missingSkills": [],
  "suggestedRoles": [],
  "improvements": []
}

resumeScore must be between 0 and 100.
`;

  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  const text = response.output_text;

  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("AI JSON parsing error:", error);
    throw new Error("AI returned an invalid response");
  }
};

module.exports = {
  analyzeResumeWithAI,
};