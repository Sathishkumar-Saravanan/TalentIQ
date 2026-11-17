const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const recommendJobs = async (resume, jobs) => {

    const jobData = jobs.map((job) => ({
        jobId: job._id,
        title: job.title,
        companyName: job.companyName,
        description: job.description,
        requiredSkills: job.requiredSkills || [],
        preferredSkills: job.preferredSkills || [],
        experienceRequired: job.experienceRequired,
        location: job.location,
        jobType: job.jobType,
    }));

    const prompt = `
You are TalentIQ, an AI-powered recruitment assistant.

Recommend the most suitable jobs for the candidate based on their resume.

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

Achievements:
${JSON.stringify(resume.achievements || [])}


AVAILABLE JOBS:

${JSON.stringify(jobData, null, 2)}


Analyze the candidate against every available job.

Consider:

1. Required skills
2. Preferred skills
3. Experience
4. Education
5. Projects
6. Certifications
7. Overall career suitability

Return ONLY valid JSON in this format:

{
    "recommendations": [
        {
            "jobId": "",
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
- Include only jobs with a matchScore of 50 or higher.
- Sort recommendations from highest matchScore to lowest.
- Do not invent candidate skills.
- Do not invent job requirements.
- recommendation must be one of:
  "Strong Match",
  "Good Match",
  "Moderate Match"
`;

    const response = await client.responses.create({
        model: "gpt-5-mini",
        input: prompt,
    });

    const result = response.output_text;

    try {
        return JSON.parse(result);
    } catch (error) {

        console.error(
            "AI Job Recommendation JSON Error:",
            error
        );

        console.error(
            "AI Response:",
            result
        );

        throw new Error(
            "AI returned invalid job recommendation data"
        );
    }
};

module.exports = {
    recommendJobs,
};