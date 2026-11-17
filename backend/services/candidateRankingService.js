const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const rankCandidates = async (job, candidates) => {
  const candidateData = candidates.map((candidate, index) => ({
    candidateNumber: index + 1,
    candidateId: candidate._id,
    name: candidate.name,
    email: candidate.email,
    resume: candidate.resume,
  }));

  const prompt = `
You are TalentIQ, an AI recruitment system.

Rank the following candidates for the given job.

JOB:

Title:
${job.title}

Company:
${job.companyName}

Description:
${job.description}

Required Skills:
${job.requiredSkills?.join(", ") || "Not provided"}

Preferred Skills:
${job.preferredSkills?.join(", ") || "Not provided"}

Experience Required:
${job.experienceRequired || "Not provided"}


CANDIDATES:

${JSON.stringify(candidateData, null, 2)}


Evaluate each candidate based on:

1. Required skills
2. Preferred skills
3. Experience
4. Education
5. Projects
6. Certifications
7. Overall suitability


Return ONLY valid JSON using this structure:

{
  "rankings": [
    {
      "candidateId": "",
      "rank": 1,
      "matchScore": 0,
      "matchedSkills": [],
      "missingSkills": [],
      "strengths": [],
      "recommendation": ""
    }
  ]
}

Rules:

- matchScore must be between 0 and 100.
- Rank candidates from highest matchScore to lowest.
- Do not invent skills that are not present in the resume.
- recommendation must be one of:
  "Strong Match",
  "Good Match",
  "Moderate Match",
  "Poor Match".
`;

  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  const result = response.output_text;

  try {
    return JSON.parse(result);
  } catch (error) {
    console.error("Candidate ranking JSON error:", error);
    console.error("AI response:", result);

    throw new Error("AI returned invalid candidate ranking data");
  }
};

module.exports = {
  rankCandidates,
};