const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const matchResumeWithJob = async (resume, job) => {
  const prompt = `
You are an AI recruitment matching system for TalentIQ.

Compare the candidate's resume with the job requirements.

CANDIDATE RESUME:

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


JOB:

Company:
${job.companyName || "Not provided"}

Job Title:
${job.title || "Not provided"}

Description:
${job.description || "Not provided"}

Required Skills:
${job.requiredSkills?.join(", ") || "Not provided"}

Preferred Skills:
${job.preferredSkills?.join(", ") || "Not provided"}

Experience Required:
${job.experienceRequired || "Not provided"}

Location:
${job.location || "Not provided"}

Job Type:
${job.jobType || "Not provided"}


Analyze the compatibility between the candidate and the job.

Return ONLY valid JSON in this exact format:

{
  "matchScore": 0,
  "matchedSkills": [],
  "missingSkills": [],
  "experienceMatch": "",
  "educationMatch": "",
  "strengths": [],
  "recommendation": ""
}

Rules:

- matchScore must be a number between 0 and 100.
- matchedSkills should contain skills the candidate has that are relevant to the job.
- missingSkills should contain important required or preferred skills the candidate does not have.
- experienceMatch should briefly explain the experience compatibility.
- educationMatch should briefly explain the education compatibility.
- strengths should contain 3 to 5 points.
- recommendation should clearly state whether the candidate is a Strong Match, Good Match, Moderate Match, or Poor Match.
`;

  const response = await client.responses.create({
    model: "gpt-5-mini",
    input: prompt,
  });

  const result = response.output_text;

  try {
    return JSON.parse(result);
  } catch (error) {
    console.error("AI matching JSON error:", error);
    console.error("AI response:", result);

    throw new Error("AI returned invalid matching data");
  }
};

module.exports = {
  matchResumeWithJob,
};